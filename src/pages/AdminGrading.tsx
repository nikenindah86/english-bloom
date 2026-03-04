import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { CheckSquare, Loader2, ChevronDown, ChevronUp, Save } from "lucide-react";

type Submission = {
  id: string;
  quiz_id: string;
  student_id: string;
  score: number | null;
  feedback: string | null;
  status: string;
  created_at: string;
  quiz_title: string;
  student_name: string;
};

type AnswerDetail = {
  id: string;
  question_text: string;
  question_type: string;
  media_url: string | null;
  correct_answer: string | null;
  answer_text: string | null;
};

const AdminGrading = () => {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswerDetail[]>([]);
  const [answersLoading, setAnswersLoading] = useState(false);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [tab, setTab] = useState("all");

  const fetchSubmissions = async () => {
    const { data: subs } = await supabase
      .from("quiz_submissions")
      .select("*")
      .order("created_at", { ascending: false });

    if (!subs) { setLoading(false); return; }

    // Get quiz titles and student names
    const quizIds = [...new Set(subs.map((s) => s.quiz_id))];
    const studentIds = [...new Set(subs.map((s) => s.student_id))];

    const [{ data: quizData }, { data: profileData }] = await Promise.all([
      supabase.from("quizzes").select("id, title").in("id", quizIds),
      supabase.from("profiles").select("id, full_name").in("id", studentIds),
    ]);

    const quizMap: Record<string, string> = {};
    quizData?.forEach((q) => (quizMap[q.id] = q.title));
    const profileMap: Record<string, string> = {};
    profileData?.forEach((p) => (profileMap[p.id] = p.full_name || "Unknown"));

    const mapped: Submission[] = subs.map((s) => ({
      ...s,
      quiz_title: quizMap[s.quiz_id] || "Unknown Quiz",
      student_name: profileMap[s.student_id] || "Unknown Student",
    }));

    setSubmissions(mapped);
    const sc: Record<string, string> = {};
    const fb: Record<string, string> = {};
    mapped.forEach((s) => {
      sc[s.id] = s.score?.toString() || "";
      fb[s.id] = s.feedback || "";
    });
    setScores(sc);
    setFeedbacks(fb);
    setLoading(false);
  };

  useEffect(() => { fetchSubmissions(); }, []);

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    setAnswersLoading(true);

    const sub = submissions.find((s) => s.id === id)!;

    // Get questions for this quiz
    const { data: questionsData } = await supabase
      .from("quiz_questions")
      .select("*")
      .eq("quiz_id", sub.quiz_id)
      .order("order_index");

    // Get answers for this submission
    const { data: answersData } = await supabase
      .from("submission_answers")
      .select("*")
      .eq("submission_id", id);

    const answerMap: Record<string, string> = {};
    answersData?.forEach((a) => (answerMap[a.question_id] = a.answer_text || ""));

    const details: AnswerDetail[] = (questionsData || []).map((q) => ({
      id: q.id,
      question_text: q.question_text,
      question_type: q.question_type,
      media_url: q.media_url,
      correct_answer: q.correct_answer,
      answer_text: answerMap[q.id] || null,
    }));

    setAnswers(details);
    setAnswersLoading(false);
  };

  const saveGrade = async (id: string) => {
    setSavingId(id);
    const scoreVal = scores[id] ? parseFloat(scores[id]) : null;
    await supabase
      .from("quiz_submissions")
      .update({
        score: scoreVal,
        feedback: feedbacks[id] || null,
        status: "graded",
      })
      .eq("id", id);

    toast({ title: "Grade saved!" });
    setSavingId(null);
    fetchSubmissions();
  };

  const filtered = submissions.filter((s) => {
    if (tab === "pending") return s.status === "pending";
    if (tab === "graded") return s.status === "graded";
    return true;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="font-display font-bold text-2xl">Grading</h2>
          <p className="text-muted-foreground mt-1">Review and grade student submissions</p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-3 rounded-xl">
            <TabsTrigger value="all" className="rounded-lg text-xs">All</TabsTrigger>
            <TabsTrigger value="pending" className="rounded-lg text-xs">Pending</TabsTrigger>
            <TabsTrigger value="graded" className="rounded-lg text-xs">Graded</TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center space-y-2">
            <CheckSquare className="w-10 h-10 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">No submissions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((sub) => (
              <div key={sub.id} className="glass rounded-2xl overflow-hidden">
                <button
                  onClick={() => toggleExpand(sub.id)}
                  className="w-full p-4 flex items-center justify-between text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm truncate">{sub.student_name}</span>
                      <Badge
                        variant={sub.status === "graded" ? "default" : "secondary"}
                        className="text-[10px]"
                      >
                        {sub.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{sub.quiz_title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(sub.created_at).toLocaleDateString()}
                      {sub.score !== null && ` • Score: ${sub.score}`}
                    </p>
                  </div>
                  {expandedId === sub.id ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>

                {expandedId === sub.id && (
                  <div className="px-4 pb-4 border-t border-border space-y-3">
                    {answersLoading ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      </div>
                    ) : answers.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">No answers recorded</p>
                    ) : (
                      <div className="space-y-3 pt-3">
                        {answers.map((a, i) => (
                          <div key={a.id} className="rounded-xl bg-muted/30 p-3 space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground">Q{i + 1}</p>
                            <p className="text-sm">{a.question_text}</p>
                            {a.media_url && (
                              <a href={a.media_url} target="_blank" rel="noreferrer" className="text-xs text-primary underline">
                                View Media
                              </a>
                            )}
                            <div className="pt-1">
                              <p className="text-xs text-muted-foreground">Student Answer:</p>
                              <p className="text-sm font-medium">{a.answer_text || "—"}</p>
                            </div>
                            {a.correct_answer && (
                              <div>
                                <p className="text-xs text-muted-foreground">Expected:</p>
                                <p className="text-xs text-primary">{a.correct_answer}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold">Score</label>
                        <Input
                          type="number"
                          value={scores[sub.id] || ""}
                          onChange={(e) => setScores((p) => ({ ...p, [sub.id]: e.target.value }))}
                          placeholder="0-100"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1 col-span-2">
                        <label className="text-xs font-semibold">Feedback</label>
                        <Textarea
                          value={feedbacks[sub.id] || ""}
                          onChange={(e) => setFeedbacks((p) => ({ ...p, [sub.id]: e.target.value }))}
                          placeholder="Write feedback..."
                          rows={2}
                          className="text-sm"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={() => saveGrade(sub.id)}
                      disabled={savingId === sub.id}
                      className="w-full rounded-xl gap-2"
                      size="sm"
                    >
                      {savingId === sub.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Grade
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminGrading;
