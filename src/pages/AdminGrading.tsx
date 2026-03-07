import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { CheckSquare, Loader2, ChevronDown, ChevronUp, Save } from "lucide-react";

type UnifiedSubmission = {
  id: string;
  source: "quiz" | "assessment";
  source_id: string; // quiz_id or assessment_id
  student_id: string;
  score: number | null;
  feedback: string | null;
  status: string;
  created_at: string;
  source_title: string;
  student_name: string;
  class_id: string | null;
};

type AnswerDetail = {
  id: string;
  question_text: string;
  question_type: string;
  media_url: string | null;
  correct_answer: string | null;
  answer_text: string | null;
};

type GroupedSubmissions = {
  source_id: string;
  source: "quiz" | "assessment";
  title: string;
  class_id: string | null;
  submissions: UnifiedSubmission[];
};

const AdminGrading = () => {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<UnifiedSubmission[]>([]);
  const [classes, setClasses] = useState<{ id: string; class_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswerDetail[]>([]);
  const [answersLoading, setAnswersLoading] = useState(false);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [statusTab, setStatusTab] = useState("all");
  const [sourceTab, setSourceTab] = useState("all");
  const [selectedClassId, setSelectedClassId] = useState("all");

  const fetchData = async () => {
    setLoading(true);

    // Fetch classes, quiz submissions, assessment submissions in parallel
    const [{ data: classesData }, { data: quizSubs }, { data: assessSubs }] = await Promise.all([
      supabase.from("classes").select("id, class_name").order("class_name"),
      supabase.from("quiz_submissions").select("*").order("created_at", { ascending: false }),
      supabase.from("assessment_submissions").select("*").order("created_at", { ascending: false }),
    ]);

    setClasses(classesData || []);

    const allQuizIds = [...new Set((quizSubs || []).map((s) => s.quiz_id))];
    const allAssessIds = [...new Set((assessSubs || []).map((s) => s.assessment_id))];
    const allStudentIds = [...new Set([
      ...(quizSubs || []).map((s) => s.student_id),
      ...(assessSubs || []).map((s) => s.student_id),
    ])];

    // Fetch quiz titles, assessment titles, and profiles in parallel
    const [{ data: profileData }, { data: quizData }, { data: assessData }] = await Promise.all([
      allStudentIds.length > 0
        ? supabase.from("profiles").select("id, full_name").in("id", allStudentIds).then(r => r)
        : Promise.resolve({ data: [] as any[] }),
      allQuizIds.length > 0
        ? supabase.from("quizzes").select("id, title, class_id").in("id", allQuizIds).then(r => r)
        : Promise.resolve({ data: [] as any[] }),
      allAssessIds.length > 0
        ? supabase.from("assessments").select("id, title, class_id").in("id", allAssessIds).then(r => r)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    

    const profileMap: Record<string, string> = {};
    (profileData || []).forEach((p: any) => (profileMap[p.id] = p.full_name || "Unknown"));

    const quizMap: Record<string, { title: string; class_id: string | null }> = {};
    (quizData || []).forEach((q: any) => (quizMap[q.id] = { title: q.title, class_id: q.class_id }));

    const assessMap: Record<string, { title: string; class_id: string | null }> = {};
    (assessData || []).forEach((a: any) => (assessMap[a.id] = { title: a.title, class_id: a.class_id }));

    const unified: UnifiedSubmission[] = [];

    (quizSubs || []).forEach((s) => {
      const info = quizMap[s.quiz_id];
      unified.push({
        id: s.id,
        source: "quiz",
        source_id: s.quiz_id,
        student_id: s.student_id,
        score: s.score,
        feedback: s.feedback,
        status: s.status,
        created_at: s.created_at,
        source_title: info?.title || "Unknown Quiz",
        student_name: profileMap[s.student_id] || "Unknown Student",
        class_id: info?.class_id || null,
      });
    });

    (assessSubs || []).forEach((s) => {
      const info = assessMap[s.assessment_id];
      unified.push({
        id: s.id,
        source: "assessment",
        source_id: s.assessment_id,
        student_id: s.student_id,
        score: s.score,
        feedback: null,
        status: s.status === "submitted" ? "pending" : s.status === "graded" ? "graded" : s.status,
        created_at: s.created_at,
        source_title: info?.title || "Unknown Assessment",
        student_name: profileMap[s.student_id] || "Unknown Student",
        class_id: info?.class_id || null,
      });
    });

    setSubmissions(unified);

    const sc: Record<string, string> = {};
    const fb: Record<string, string> = {};
    unified.forEach((s) => {
      sc[s.id] = s.score?.toString() || "";
      fb[s.id] = s.feedback || "";
    });
    setScores(sc);
    setFeedbacks(fb);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const toggleExpand = async (sub: UnifiedSubmission) => {
    if (expandedId === sub.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(sub.id);
    setAnswersLoading(true);

    if (sub.source === "quiz") {
      const [{ data: questionsData }, { data: answersData }] = await Promise.all([
        supabase.from("quiz_questions").select("*").eq("quiz_id", sub.source_id).order("order_index"),
        supabase.from("submission_answers").select("*").eq("submission_id", sub.id),
      ]);

      const answerMap: Record<string, string> = {};
      answersData?.forEach((a) => (answerMap[a.question_id] = a.answer_text || ""));

      setAnswers((questionsData || []).map((q) => ({
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        media_url: q.media_url,
        correct_answer: q.correct_answer,
        answer_text: answerMap[q.id] || null,
      })));
    } else {
      const [{ data: questionsData }, { data: answersData }] = await Promise.all([
        supabase.from("assessment_questions").select("*").eq("assessment_id", sub.source_id).order("order_index"),
        supabase.from("assessment_answers").select("*").eq("submission_id", sub.id),
      ]);

      const answerMap: Record<string, string> = {};
      answersData?.forEach((a) => (answerMap[a.question_id] = a.answer_text || ""));

      setAnswers((questionsData || []).map((q) => ({
        id: q.id,
        question_text: q.question_text,
        question_type: "text_input",
        media_url: null,
        correct_answer: q.correct_answer,
        answer_text: answerMap[q.id] || null,
      })));
    }

    setAnswersLoading(false);
  };

  const saveGrade = async (sub: UnifiedSubmission) => {
    setSavingId(sub.id);
    const scoreVal = scores[sub.id] ? parseFloat(scores[sub.id]) : null;

    if (sub.source === "quiz") {
      await supabase.from("quiz_submissions").update({
        score: scoreVal,
        feedback: feedbacks[sub.id] || null,
        status: "graded",
      }).eq("id", sub.id);
    } else {
      await supabase.from("assessment_submissions").update({
        score: scoreVal,
        status: "graded",
      }).eq("id", sub.id);
    }

    toast({ title: "Grade saved!" });
    setSavingId(null);
    fetchData();
  };

  // Filter
  const filtered = submissions.filter((s) => {
    if (selectedClassId !== "all" && s.class_id !== selectedClassId) return false;
    if (sourceTab === "quiz" && s.source !== "quiz") return false;
    if (sourceTab === "assessment" && s.source !== "assessment") return false;
    if (statusTab === "pending" && s.status !== "pending") return false;
    if (statusTab === "graded" && s.status !== "graded") return false;
    return true;
  });

  // Group by source_id
  const grouped: GroupedSubmissions[] = [];
  const groupMap = new Map<string, GroupedSubmissions>();
  filtered.forEach((s) => {
    const key = `${s.source}-${s.source_id}`;
    if (!groupMap.has(key)) {
      const g: GroupedSubmissions = {
        source_id: s.source_id,
        source: s.source,
        title: s.source_title,
        class_id: s.class_id,
        submissions: [],
      };
      groupMap.set(key, g);
      grouped.push(g);
    }
    groupMap.get(key)!.submissions.push(s);
  });

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div>
          <h2 className="font-display font-bold text-2xl">Grading</h2>
          <p className="text-muted-foreground mt-1 text-sm">Review and grade student submissions</p>
        </div>

        {/* Class filter */}
        <Select value={selectedClassId} onValueChange={setSelectedClassId}>
          <SelectTrigger className="w-full rounded-xl">
            <SelectValue placeholder="All Classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.class_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Source tabs */}
        <Tabs value={sourceTab} onValueChange={setSourceTab}>
          <TabsList className="grid w-full grid-cols-3 rounded-xl">
            <TabsTrigger value="all" className="rounded-lg text-xs">All</TabsTrigger>
            <TabsTrigger value="quiz" className="rounded-lg text-xs">Quizzes</TabsTrigger>
            <TabsTrigger value="assessment" className="rounded-lg text-xs">Assessments</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Status tabs */}
        <Tabs value={statusTab} onValueChange={setStatusTab}>
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
        ) : grouped.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center space-y-2">
            <CheckSquare className="w-10 h-10 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">No submissions found</p>
          </div>
        ) : (
          <Accordion type="multiple" className="space-y-2">
            {grouped.map((group) => {
              const pendingCount = group.submissions.filter((s) => s.status === "pending").length;
              const gradedCount = group.submissions.filter((s) => s.status === "graded").length;
              const key = `${group.source}-${group.source_id}`;

              return (
                <AccordionItem key={key} value={key} className="glass rounded-2xl border-none overflow-hidden">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex flex-col items-start gap-1 text-left flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm truncate">{group.title}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {group.source === "quiz" ? "Quiz" : "Assessment"}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {pendingCount > 0 && <span className="text-destructive">{pendingCount} pending</span>}
                        {pendingCount > 0 && gradedCount > 0 && " · "}
                        {gradedCount > 0 && <span className="text-primary">{gradedCount} graded</span>}
                        {pendingCount === 0 && gradedCount === 0 && `${group.submissions.length} submissions`}
                      </p>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-2 pb-2">
                    <div className="space-y-2">
                      {group.submissions.map((sub) => (
                        <div key={sub.id} className="rounded-xl bg-muted/30 overflow-hidden">
                          <button
                            onClick={() => toggleExpand(sub)}
                            className="w-full p-3 flex items-center justify-between text-left"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm truncate">{sub.student_name}</span>
                                <Badge
                                  variant={sub.status === "graded" ? "default" : "secondary"}
                                  className="text-[10px]"
                                >
                                  {sub.status}
                                </Badge>
                              </div>
                              <p className="text-[10px] text-muted-foreground">
                                {new Date(sub.created_at).toLocaleDateString()}
                                {sub.score !== null && ` • Score: ${sub.score}`}
                              </p>
                            </div>
                            {expandedId === sub.id ? (
                              <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                            )}
                          </button>

                          {expandedId === sub.id && (
                            <div className="px-3 pb-3 border-t border-border space-y-3">
                              {answersLoading ? (
                                <div className="flex justify-center py-4">
                                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                </div>
                              ) : answers.length === 0 ? (
                                <p className="text-xs text-muted-foreground py-2">No answers recorded</p>
                              ) : (
                                <div className="space-y-3 pt-3">
                                  {answers.map((a, i) => (
                                    <div key={a.id} className="rounded-xl bg-background/50 p-3 space-y-1">
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
                                onClick={() => saveGrade(sub)}
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
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminGrading;
