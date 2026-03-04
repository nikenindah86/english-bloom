import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import StudentLayout from "@/components/student/StudentLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Loader2 } from "lucide-react";

const isImageUrl = (url: string) => /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(url);

const StudentQuiz = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !user) return;
    const load = async () => {
      const [quizRes, questionsRes, subRes] = await Promise.all([
        supabase.from("quizzes").select("*").eq("id", id).single(),
        supabase.from("quiz_questions").select("*").eq("quiz_id", id).order("order_index"),
        supabase.from("quiz_submissions").select("id").eq("quiz_id", id).eq("student_id", user.id),
      ]);
      setQuiz(quizRes.data);
      setQuestions(questionsRes.data || []);
      if ((subRes.data || []).length > 0) setAlreadySubmitted(true);
      setLoading(false);
    };
    load();
  }, [id, user]);

  const handleSubmit = async () => {
    if (!user || !id) return;
    setSubmitting(true);

    const { data: submission, error: subError } = await supabase
      .from("quiz_submissions")
      .insert({ quiz_id: id, student_id: user.id, status: "pending" })
      .select("id")
      .single();

    if (subError || !submission) {
      toast({ title: "Error", description: "Failed to submit quiz.", variant: "destructive" });
      setSubmitting(false);
      return;
    }

    const answerRows = questions.map((q) => ({
      submission_id: submission.id,
      question_id: q.id,
      answer_text: answers[q.id] || "",
    }));

    const { error: ansError } = await supabase.from("submission_answers").insert(answerRows);
    if (ansError) {
      toast({ title: "Error", description: "Failed to save answers.", variant: "destructive" });
      setSubmitting(false);
      return;
    }

    toast({ title: "Quiz Submitted! 🎉", description: "Your teacher will review it soon." });
    navigate("/student/grades");
  };

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

  if (alreadySubmitted) {
    return (
      <StudentLayout>
        <div className="glass rounded-2xl p-8 text-center space-y-3">
          <CheckCircle className="w-12 h-12 mx-auto text-primary" />
          <h2 className="font-display font-bold text-lg">Already Submitted</h2>
          <p className="text-sm text-muted-foreground">You've already completed this quiz. Check your grades for results!</p>
          <Button onClick={() => navigate("/student/grades")} className="rounded-xl mt-2">
            View Grades
          </Button>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h2 className="font-display font-bold text-2xl">{quiz.title}</h2>
          {quiz.description && <p className="text-muted-foreground mt-1 text-sm">{quiz.description}</p>}
          <p className="text-xs text-muted-foreground mt-2">{questions.length} question{questions.length !== 1 ? "s" : ""}</p>
        </div>

        <div className="space-y-4">
          {questions.map((q, idx) => (
            <div key={q.id} className="glass rounded-2xl p-5 space-y-3">
              <p className="font-display font-bold text-sm">
                <span className="text-primary mr-1.5">Q{idx + 1}.</span>
                {q.question_text}
              </p>

              {q.media_url && (
                <div className="rounded-xl overflow-hidden border border-border">
                  {isImageUrl(q.media_url) ? (
                    <img src={q.media_url} alt="Question media" className="w-full max-h-60 object-contain bg-muted" />
                  ) : (
                    <audio controls className="w-full" src={q.media_url}>
                      Your browser does not support audio.
                    </audio>
                  )}
                </div>
              )}

              {q.question_type === "multiple_choice" && Array.isArray(q.options) ? (
                <RadioGroup
                  value={answers[q.id] || ""}
                  onValueChange={(val) => setAnswers((prev) => ({ ...prev, [q.id]: val }))}
                  className="space-y-2"
                >
                  {(q.options as string[]).map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-accent/50 transition-colors">
                      <RadioGroupItem value={opt} id={`${q.id}-${oi}`} />
                      <Label htmlFor={`${q.id}-${oi}`} className="text-sm cursor-pointer flex-1">
                        {opt}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <Textarea
                  placeholder="Type your answer here…"
                  value={answers[q.id] || ""}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                  className="rounded-xl"
                />
              )}
            </div>
          ))}
        </div>

        <Button onClick={handleSubmit} disabled={submitting} className="w-full rounded-xl h-12 text-base font-bold">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Submit Quiz 🎯
        </Button>
      </div>
    </StudentLayout>
  );
};

export default StudentQuiz;
