import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Clock, ChevronLeft, ChevronRight, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Question = {
  id: string;
  section_id: string;
  question_text: string;
  options: string[] | null;
  correct_answer: string | null;
  difficulty: string;
  cognitive_level: string;
  order_index: number;
};

type Section = {
  id: string;
  title: string;
  question_type: string;
  reading_passage: string | null;
  order_index: number;
};

const StudentAssessment = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [assessment, setAssessment] = useState<any>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [started, setStarted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  // Load assessment data
  useEffect(() => {
    if (!id || !user) return;
    const load = async () => {
      const [{ data: a }, { data: secs }, { data: qs }, { data: existingSub }] = await Promise.all([
        supabase.from("assessments").select("*").eq("id", id).single(),
        supabase.from("assessment_sections").select("*").eq("assessment_id", id).order("order_index"),
        supabase.from("assessment_questions").select("*").eq("assessment_id", id).order("order_index"),
        supabase.from("assessment_submissions").select("*").eq("assessment_id", id).eq("student_id", user.id).order("created_at", { ascending: false }).limit(1),
      ]);

      if (!a) { navigate("/student/assessments"); return; }
      setAssessment(a);
      setSections((secs || []).map((s: any) => ({ id: s.id, title: s.title, question_type: s.question_type, reading_passage: s.reading_passage, order_index: s.order_index })));
      setQuestions((qs || []).map((q: any) => ({ id: q.id, section_id: q.section_id, question_text: q.question_text, options: q.options as string[] | null, correct_answer: q.correct_answer, difficulty: q.difficulty, cognitive_level: q.cognitive_level, order_index: q.order_index })));
      setTimeLeft(a.duration_minutes * 60);

      // Check existing submission
      const sub = existingSub?.[0];
      if (sub?.status === "submitted" || sub?.status === "graded") {
        toast({ title: "You have already completed this assessment" });
        navigate("/student/assessments");
        return;
      }
      if (sub?.status === "in_progress") {
        setSubmissionId(sub.id);
        setStarted(true);
        // Calculate remaining time
        const elapsed = Math.floor((Date.now() - new Date(sub.started_at).getTime()) / 1000);
        setTimeLeft(Math.max(0, a.duration_minutes * 60 - elapsed));
        // Load existing answers
        const { data: existingAnswers } = await supabase.from("assessment_answers").select("question_id, answer_text").eq("submission_id", sub.id);
        if (existingAnswers) {
          const ansMap: Record<string, string> = {};
          existingAnswers.forEach((ea) => { ansMap[ea.question_id] = ea.answer_text || ""; });
          setAnswers(ansMap);
        }
      }
      setLoading(false);
    };
    load();
  }, [id, user]);

  // Timer
  useEffect(() => {
    if (!started || timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [started]);

  const handleStart = async () => {
    if (!user || !id) return;
    const { data } = await supabase.from("assessment_submissions").insert({
      assessment_id: id,
      student_id: user.id,
      status: "in_progress",
    }).select().single();
    if (data) {
      setSubmissionId(data.id);
      setStarted(true);
    }
  };

  const setAnswer = useCallback((questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  const toggleMcmaAnswer = useCallback((questionId: string, option: string) => {
    setAnswers((prev) => {
      const current = prev[questionId] || "[]";
      let selected: string[];
      try { selected = JSON.parse(current); } catch { selected = []; }
      if (selected.includes(option)) {
        selected = selected.filter((o) => o !== option);
      } else {
        selected = [...selected, option];
      }
      return { ...prev, [questionId]: JSON.stringify(selected) };
    });
  }, []);

  const handleSubmit = async () => {
    if (!submissionId || submitting) return;
    setSubmitting(true);
    clearInterval(timerRef.current);

    try {
      // Upsert answers
      const answerRows = questions.map((q) => ({
        submission_id: submissionId,
        question_id: q.id,
        answer_text: answers[q.id] || "",
        is_correct: q.correct_answer ? (answers[q.id] || "").trim().toLowerCase() === q.correct_answer.trim().toLowerCase() : null,
        points: q.correct_answer && (answers[q.id] || "").trim().toLowerCase() === q.correct_answer.trim().toLowerCase() ? 1 : 0,
      }));

      // Delete old answers and insert new
      await supabase.from("assessment_answers").delete().eq("submission_id", submissionId);
      await supabase.from("assessment_answers").insert(answerRows);

      // Calculate score
      const totalCorrect = answerRows.filter((a) => a.is_correct).length;
      const score = questions.length > 0 ? Math.round((totalCorrect / questions.length) * 100) : 0;

      await supabase.from("assessment_submissions").update({
        status: "submitted",
        submitted_at: new Date().toISOString(),
        score,
      }).eq("id", submissionId);

      toast({ title: "Assessment submitted!", description: `Score: ${score}%` });
      navigate("/student/assessments");
    } catch (e: any) {
      toast({ title: "Error submitting", description: e.message, variant: "destructive" });
    }
    setSubmitting(false);
    setConfirmSubmit(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!assessment) return null;

  // Start screen
  if (!started) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass rounded-2xl p-6 max-w-md w-full space-y-4 text-center">
          <h2 className="font-display font-bold text-xl">{assessment.title}</h2>
          {assessment.description && <p className="text-sm text-muted-foreground">{assessment.description}</p>}
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {assessment.duration_minutes} min</span>
            <span>{questions.length} questions</span>
          </div>
          <Button onClick={handleStart} className="w-full rounded-xl" size="lg">Start Assessment</Button>
          <Button variant="ghost" onClick={() => navigate("/student/assessments")} className="w-full text-xs">Cancel</Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];
  const currentSection = sections.find((s) => s.id === currentQuestion?.section_id);
  const answeredCount = questions.filter((q) => answers[q.id]?.trim()).length;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass-strong sticky top-0 z-40 border-b border-border/50">
        <div className="flex items-center justify-between h-12 px-4">
          <h3 className="font-display font-bold text-sm truncate">{assessment.title}</h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{answeredCount}/{questions.length} answered</span>
            <Badge variant={timeLeft < 300 ? "destructive" : "secondary"} className="font-mono text-xs gap-1">
              <Clock className="w-3 h-3" /> {formatTime(timeLeft)}
            </Badge>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Reading passage (if any) */}
        {currentSection?.reading_passage && (
          <div className="md:w-1/2 p-4 border-b md:border-b-0 md:border-r border-border/50 overflow-y-auto max-h-[30vh] md:max-h-none">
            <h4 className="font-semibold text-xs text-muted-foreground mb-2">Reading Passage</h4>
            <div className="text-sm leading-relaxed whitespace-pre-wrap">{currentSection.reading_passage}</div>
          </div>
        )}

        {/* Question area */}
        <div className="flex-1 p-4 flex flex-col">
          {currentQuestion && (
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">{currentSection?.title}</Badge>
                <Badge variant="outline" className="text-[10px]">{currentQuestion.difficulty}</Badge>
                <Badge variant="outline" className="text-[10px]">{currentQuestion.cognitive_level}</Badge>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Question {currentIdx + 1} of {questions.length}</p>
                <p className="font-medium text-sm leading-relaxed">{currentQuestion.question_text}</p>
              </div>

              {/* Answer input based on type */}
              {currentSection?.question_type === "true_false_statement" ? (
                /* Statement table for T/F */
                <div className="rounded-xl border border-border overflow-hidden">
                  <div className="grid grid-cols-[1fr_60px_60px] text-xs font-bold bg-muted/50">
                    <div className="p-2">Statement</div>
                    <div className="p-2 text-center">True</div>
                    <div className="p-2 text-center">False</div>
                  </div>
                  <div className="grid grid-cols-[1fr_60px_60px] text-sm border-t border-border">
                    <div className="p-3">{currentQuestion.question_text}</div>
                    <div className="p-2 flex items-center justify-center border-l border-border">
                      <button onClick={() => setAnswer(currentQuestion.id, "True")}
                        className={cn("w-6 h-6 rounded-full border-2 transition-all", answers[currentQuestion.id] === "True" ? "border-primary bg-primary" : "border-muted-foreground/40")} />
                    </div>
                    <div className="p-2 flex items-center justify-center border-l border-border">
                      <button onClick={() => setAnswer(currentQuestion.id, "False")}
                        className={cn("w-6 h-6 rounded-full border-2 transition-all", answers[currentQuestion.id] === "False" ? "border-primary bg-primary" : "border-muted-foreground/40")} />
                    </div>
                  </div>
                </div>
              ) : currentSection?.question_type === "mcma" && currentQuestion.options ? (
                /* MCMA checkboxes */
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground italic">Select all correct answers</p>
                  {(currentQuestion.options as string[]).map((opt, i) => {
                    let selected: string[];
                    try { selected = JSON.parse(answers[currentQuestion.id] || "[]"); } catch { selected = []; }
                    const isChecked = selected.includes(opt);
                    return (
                      <button key={i} onClick={() => toggleMcmaAnswer(currentQuestion.id, opt)}
                        className={cn(
                          "w-full text-left p-3 rounded-xl border text-sm transition-all flex items-center gap-3",
                          isChecked ? "border-primary bg-primary/10 font-medium" : "border-border hover:border-primary/50"
                        )}>
                        <div className={cn("w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                          isChecked ? "border-primary bg-primary" : "border-muted-foreground/40")}>
                          {isChecked && <span className="text-primary-foreground text-xs font-bold">✓</span>}
                        </div>
                        <span><span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>{opt}</span>
                      </button>
                    );
                  })}
                </div>
              ) : currentQuestion.options ? (
                <div className="space-y-2">
                  {(currentQuestion.options as string[]).map((opt, i) => (
                    <button key={i} onClick={() => setAnswer(currentQuestion.id, opt)}
                      className={cn(
                        "w-full text-left p-3 rounded-xl border text-sm transition-all",
                        answers[currentQuestion.id] === opt
                          ? "border-primary bg-primary/10 font-medium"
                          : "border-border hover:border-primary/50"
                      )}>
                      <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <Textarea
                  value={answers[currentQuestion.id] || ""}
                  onChange={(e) => setAnswer(currentQuestion.id, e.target.value)}
                  placeholder="Type your answer..."
                  rows={4}
                  className="text-sm"
                />
              )}

              {/* Navigation buttons */}
              <div className="flex items-center justify-between pt-4">
                <Button variant="outline" size="sm" disabled={currentIdx === 0} onClick={() => setCurrentIdx(currentIdx - 1)} className="rounded-xl gap-1">
                  <ChevronLeft className="w-4 h-4" /> Prev
                </Button>
                {currentIdx < questions.length - 1 ? (
                  <Button size="sm" onClick={() => setCurrentIdx(currentIdx + 1)} className="rounded-xl gap-1">
                    Next <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => setConfirmSubmit(true)} className="rounded-xl gap-1 bg-primary">
                    <Send className="w-4 h-4" /> Submit
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Question navigator */}
      <div className="glass-strong border-t border-border/50 p-3">
        <div className="flex items-center gap-1.5 flex-wrap justify-center max-w-lg mx-auto">
          {questions.map((q, i) => (
            <button key={q.id} onClick={() => setCurrentIdx(i)}
              className={cn(
                "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                i === currentIdx ? "bg-primary text-primary-foreground" :
                answers[q.id]?.trim() ? "bg-primary/20 text-primary" :
                "bg-muted text-muted-foreground"
              )}>
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Submit confirmation */}
      <AlertDialog open={confirmSubmit} onOpenChange={setConfirmSubmit}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Assessment?</AlertDialogTitle>
            <AlertDialogDescription>
              You have answered {answeredCount} of {questions.length} questions.
              {answeredCount < questions.length && ` ${questions.length - answeredCount} question(s) are unanswered.`}
              {" "}This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 animate-spin mr-1" />} Submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StudentAssessment;
