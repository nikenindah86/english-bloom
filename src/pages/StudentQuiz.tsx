import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import StudentLayout from "@/components/student/StudentLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Loader2, Play, Zap, Clock, Trophy, ArrowRight } from "lucide-react";
import QuizLeaderboard from "@/components/QuizLeaderboard";

const isImageUrl = (url: string) => /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(url);

const OPTION_COLORS = [
  "bg-red-500 hover:bg-red-600",
  "bg-blue-500 hover:bg-blue-600",
  "bg-green-500 hover:bg-green-600",
  "bg-yellow-500 hover:bg-yellow-600",
];

type Phase = "start" | "question" | "feedback" | "results";

type AnswerRecord = {
  question_id: string;
  answer_text: string;
  is_correct: boolean | null;
  time_taken_ms: number;
  points: number;
};

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const StudentQuiz = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Game state
  const [phase, setPhase] = useState<Phase>("start");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answerRecords, setAnswerRecords] = useState<AnswerRecord[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [textAnswer, setTextAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Timer
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const questionStartRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Shuffled options per question
  const [shuffledOptions, setShuffledOptions] = useState<Record<number, string[]>>({});

  useEffect(() => {
    if (!id || !user) return;
    const load = async () => {
      const [quizRes, questionsRes, subRes] = await Promise.all([
        supabase.from("quizzes").select("*").eq("id", id).single(),
        supabase.from("quiz_questions").select("*").eq("quiz_id", id).order("order_index"),
        supabase.from("quiz_submissions").select("id").eq("quiz_id", id).eq("student_id", user.id),
      ]);
      setQuiz(quizRes.data);
      const qs = questionsRes.data || [];
      setQuestions(qs);
      if ((subRes.data || []).length > 0) setAlreadySubmitted(true);
      setLoading(false);
    };
    load();
  }, [id, user]);

  const startQuiz = () => {
    if (!quiz || questions.length === 0) return;
    let qs = [...questions];
    if (quiz.shuffle_questions) qs = shuffleArray(qs);

    // Pre-shuffle options
    const opts: Record<number, string[]> = {};
    qs.forEach((q, i) => {
      if (q.question_type === "multiple_choice" && Array.isArray(q.options)) {
        opts[i] = quiz.shuffle_options ? shuffleArray(q.options as string[]) : (q.options as string[]);
      }
    });

    setQuestions(qs);
    setShuffledOptions(opts);
    setPhase("question");
    setCurrentIdx(0);
    setAnswerRecords([]);
    setStreak(0);
    startTimer();
  };

  const startTimer = useCallback(() => {
    questionStartRef.current = Date.now();
    if (timerRef.current) clearInterval(timerRef.current);
    if (quiz?.time_limit) {
      setTimeLeft(quiz.time_limit);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === null || prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setTimeLeft(null);
    }
  }, [quiz]);

  // Auto-submit when timer hits 0
  useEffect(() => {
    if (timeLeft === 0 && phase === "question") {
      handleAnswer("");
    }
  }, [timeLeft, phase]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleAnswer = (answer: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const timeTaken = Date.now() - questionStartRef.current;
    const q = questions[currentIdx];
    const isMcq = q.question_type === "multiple_choice";
    const isCorrect = isMcq && q.correct_answer ? answer === q.correct_answer : null;

    // Calculate points
    let points = 0;
    if (isCorrect === true) {
      const basePoints = quiz?.points_per_question || 100;
      const timeLimit = quiz?.time_limit ? quiz.time_limit * 1000 : 30000;
      const speedMultiplier = Math.max(0.5, 1 - timeTaken / timeLimit);
      points = Math.round(basePoints * speedMultiplier);
    }

    const newStreak = isCorrect === true ? streak + 1 : isCorrect === false ? 0 : streak;
    setStreak(newStreak);

    const record: AnswerRecord = {
      question_id: q.id,
      answer_text: answer,
      is_correct: isCorrect,
      time_taken_ms: timeTaken,
      points,
    };

    setAnswerRecords((prev) => [...prev, record]);
    setSelectedAnswer(answer);

    if (quiz?.show_answers_after && isMcq) {
      setPhase("feedback");
    } else {
      goNext([...answerRecords, record]);
    }
  };

  const goNext = (records?: AnswerRecord[]) => {
    const recs = records || answerRecords;
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((i) => i + 1);
      setSelectedAnswer(null);
      setTextAnswer("");
      setPhase("question");
      startTimer();
    } else {
      setPhase("results");
      submitQuiz(recs);
    }
  };

  const submitQuiz = async (records: AnswerRecord[]) => {
    if (!user || !id) return;
    setSubmitting(true);

    const totalPoints = records.reduce((sum, r) => sum + r.points, 0);
    const allMcq = questions.every((q) => q.question_type === "multiple_choice");
    const status = allMcq ? "graded" : "pending";

    const { data: submission, error: subError } = await supabase
      .from("quiz_submissions")
      .insert({ quiz_id: id, student_id: user.id, status, score: totalPoints })
      .select("id")
      .single();

    if (subError || !submission) {
      toast({ title: "Error", description: "Failed to submit quiz.", variant: "destructive" });
      setSubmitting(false);
      return;
    }

    const answerRows = records.map((r) => ({
      submission_id: submission.id,
      question_id: r.question_id,
      answer_text: r.answer_text,
      is_correct: r.is_correct,
      time_taken_ms: r.time_taken_ms,
      points: r.points,
    }));

    await supabase.from("submission_answers").insert(answerRows);
    setSubmitting(false);
  };

  // Computed stats
  const totalPoints = answerRecords.reduce((s, r) => s + r.points, 0);
  const correctCount = answerRecords.filter((r) => r.is_correct === true).length;
  const totalMcq = answerRecords.filter((r) => r.is_correct !== null).length;
  const accuracy = totalMcq > 0 ? Math.round((correctCount / totalMcq) * 100) : 0;
  const totalTime = answerRecords.reduce((s, r) => s + r.time_taken_ms, 0);

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </StudentLayout>
    );
  }

  if (!quiz) {
    return (
      <StudentLayout>
        <div className="glass rounded-2xl p-8 text-center">
          <p className="text-muted-foreground">Quiz not found</p>
        </div>
      </StudentLayout>
    );
  }

  // Check expiry
  const isExpired = quiz?.expires_at && new Date(quiz.expires_at) < new Date();
  const isUpcoming = quiz?.scheduled_at && new Date(quiz.scheduled_at) > new Date();

  if (alreadySubmitted) {
    return (
      <StudentLayout>
        <div className="glass rounded-2xl p-8 text-center space-y-3">
          <CheckCircle className="w-12 h-12 mx-auto text-primary" />
          <h2 className="font-display font-bold text-lg">Already Submitted</h2>
          <p className="text-sm text-muted-foreground">You've already completed this quiz.</p>
          <Button onClick={() => navigate("/student/grades")} className="rounded-xl mt-2">View Grades</Button>
        </div>
      </StudentLayout>
    );
  }

  if (isExpired) {
    return (
      <StudentLayout>
        <div className="glass rounded-2xl p-8 text-center space-y-3">
          <Clock className="w-12 h-12 mx-auto text-destructive" />
          <h2 className="font-display font-bold text-lg">Quiz Expired</h2>
          <p className="text-sm text-muted-foreground">This quiz is no longer available.</p>
          <Button onClick={() => navigate("/student/quizzes")} className="rounded-xl mt-2">Back to Quizzes</Button>
        </div>
      </StudentLayout>
    );
  }

  if (isUpcoming) {
    return (
      <StudentLayout>
        <div className="glass rounded-2xl p-8 text-center space-y-3">
          <Clock className="w-12 h-12 mx-auto text-amber-500" />
          <h2 className="font-display font-bold text-lg">Quiz Not Yet Available</h2>
          <p className="text-sm text-muted-foreground">Opens at {new Date(quiz.scheduled_at).toLocaleString()}</p>
          <Button onClick={() => navigate("/student/quizzes")} className="rounded-xl mt-2">Back to Quizzes</Button>
        </div>
      </StudentLayout>
    );
  }

  // === START SCREEN ===
  if (phase === "start") {
    return (
      <StudentLayout>
        <div className="flex flex-col items-center justify-center py-8 space-y-6 animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Zap className="w-10 h-10 text-primary" />
          </div>
          <div className="text-center space-y-2">
            <h1 className="font-display font-bold text-2xl">{quiz.title}</h1>
            {quiz.description && <p className="text-muted-foreground text-sm max-w-md">{quiz.description}</p>}
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">📋 {questions.length} question{questions.length !== 1 ? "s" : ""}</span>
            {quiz.time_limit && <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {quiz.time_limit}s/question</span>}
            <span className="flex items-center gap-1"><Trophy className="w-4 h-4" /> {quiz.points_per_question || 100} pts each</span>
          </div>
          <Button onClick={startQuiz} size="lg" className="rounded-xl gap-2 h-14 px-8 text-lg font-bold">
            <Play className="w-5 h-5" /> Start Quiz
          </Button>
        </div>
      </StudentLayout>
    );
  }

  const currentQ = questions[currentIdx];
  const isMcq = currentQ?.question_type === "multiple_choice";
  const options = shuffledOptions[currentIdx] || (currentQ?.options as string[]) || [];
  const progressPct = ((currentIdx + 1) / questions.length) * 100;

  // === FEEDBACK SCREEN ===
  if (phase === "feedback") {
    const lastRecord = answerRecords[answerRecords.length - 1];
    const isCorrect = lastRecord?.is_correct === true;

    return (
      <StudentLayout>
        <div className="flex flex-col items-center justify-center py-8 space-y-6 animate-fade-in">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center ${isCorrect ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
            {isCorrect ? (
              <CheckCircle className="w-12 h-12 text-green-500" />
            ) : (
              <XCircle className="w-12 h-12 text-red-500" />
            )}
          </div>
          <h2 className="font-display font-bold text-xl">{isCorrect ? "Correct! 🎉" : "Wrong! 😅"}</h2>
          {!isCorrect && currentQ.correct_answer && (
            <p className="text-sm text-muted-foreground">
              Correct answer: <span className="font-bold text-foreground">{currentQ.correct_answer}</span>
            </p>
          )}
          <div className="flex items-center gap-4">
            {lastRecord?.points > 0 && (
              <div className="flex items-center gap-1 text-primary font-bold">
                <Zap className="w-4 h-4" /> +{lastRecord.points} pts
              </div>
            )}
            {streak > 1 && (
              <div className="text-sm font-bold text-orange-500">🔥 {streak} streak!</div>
            )}
          </div>
          <Button onClick={() => goNext()} className="rounded-xl gap-2 h-12 px-6">
            {currentIdx + 1 < questions.length ? (
              <>Next <ArrowRight className="w-4 h-4" /></>
            ) : (
              "See Results 🏆"
            )}
          </Button>
        </div>
      </StudentLayout>
    );
  }

  // === RESULTS SCREEN ===
  if (phase === "results") {
    return (
      <StudentLayout>
        <div className="space-y-6 animate-fade-in">
          <div className="glass rounded-2xl p-6 text-center space-y-4">
            <Trophy className="w-16 h-16 mx-auto text-yellow-500" />
            <h2 className="font-display font-bold text-2xl">Quiz Complete! 🎉</h2>
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-2xl font-bold text-primary">{totalPoints}</p>
                <p className="text-xs text-muted-foreground">Points</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-2xl font-bold text-primary">{accuracy}%</p>
                <p className="text-xs text-muted-foreground">Accuracy</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-2xl font-bold text-primary">{Math.round(totalTime / 1000)}s</p>
                <p className="text-xs text-muted-foreground">Time</p>
              </div>
            </div>
            {submitting && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </div>
            )}
          </div>

          {/* Per-question breakdown */}
          <div className="glass rounded-2xl p-4 space-y-3">
            <h3 className="font-display font-bold text-sm">Question Breakdown</h3>
            {answerRecords.map((r, i) => {
              const q = questions[i];
              return (
                <div key={r.question_id} className="flex items-center gap-3 rounded-xl bg-muted/30 p-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${r.is_correct === true ? "bg-green-100 dark:bg-green-900/30" : r.is_correct === false ? "bg-red-100 dark:bg-red-900/30" : "bg-muted"}`}>
                    {r.is_correct === true ? <CheckCircle className="w-4 h-4 text-green-500" /> : r.is_correct === false ? <XCircle className="w-4 h-4 text-red-500" /> : <span className="text-xs text-muted-foreground">—</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate">{q?.question_text}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Your answer: {r.answer_text || "—"}
                      {r.is_correct === false && q?.correct_answer && ` • Correct: ${q.correct_answer}`}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-primary shrink-0">{r.points}pts</span>
                </div>
              );
            })}
          </div>

          {/* Leaderboard */}
          <div className="glass rounded-2xl p-4">
            <QuizLeaderboard quizId={id!} />
          </div>

          <Button onClick={() => navigate("/student/grades")} className="w-full rounded-xl h-12">
            View Grades
          </Button>
        </div>
      </StudentLayout>
    );
  }

  // === QUESTION SCREEN ===
  return (
    <StudentLayout>
      <div className="space-y-4 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-muted-foreground">
            {currentIdx + 1} / {questions.length}
          </span>
          <div className="flex items-center gap-3">
            {streak > 1 && <span className="text-xs font-bold text-orange-500">🔥 {streak}</span>}
            <span className="text-sm font-bold text-primary">{totalPoints} pts</span>
          </div>
        </div>
        <Progress value={progressPct} className="h-2 rounded-full" />

        {/* Timer */}
        {timeLeft !== null && (
          <div className="flex justify-center">
            <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center font-bold text-xl ${timeLeft <= 5 ? "border-red-500 text-red-500 animate-pulse" : "border-primary text-primary"}`}>
              {timeLeft}
            </div>
          </div>
        )}

        {/* Question Card */}
        <div className="glass rounded-2xl p-5 space-y-4">
          <p className="font-display font-bold text-base leading-relaxed">{currentQ.question_text}</p>

          {currentQ.media_url && (
            <div className="rounded-xl overflow-hidden border border-border">
              {isImageUrl(currentQ.media_url) ? (
                <img src={currentQ.media_url} alt="Question media" className="w-full max-h-48 object-contain bg-muted" />
              ) : (
                <audio controls className="w-full" src={currentQ.media_url}>
                  Your browser does not support audio.
                </audio>
              )}
            </div>
          )}
        </div>

        {/* Options */}
        {isMcq ? (
          <div className="grid grid-cols-2 gap-3">
            {options.map((opt: string, oi: number) => (
              <button
                key={oi}
                onClick={() => handleAnswer(opt)}
                className={`${OPTION_COLORS[oi % 4]} text-white rounded-2xl p-4 min-h-[80px] flex items-center justify-center text-center font-bold text-sm transition-all active:scale-95`}
              >
                {opt}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <Textarea
              placeholder="Type your answer here…"
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              className="rounded-xl min-h-[100px]"
            />
            <Button
              onClick={() => handleAnswer(textAnswer)}
              className="w-full rounded-xl h-12 font-bold"
              disabled={!textAnswer.trim()}
            >
              Submit Answer <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentQuiz;
