import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Plus, Trash2, GripVertical, Image, Edit, Loader2, Eye, Copy, Sparkles } from "lucide-react";
import ApiKeyManager from "@/components/admin/ApiKeyManager";
import AiQuizGenerator from "@/components/admin/AiQuizGenerator";

type QuestionDraft = {
  id?: string;
  question_text: string;
  question_type: "text_input" | "multiple_choice";
  media_url: string;
  options: string[];
  correct_answer: string;
  order_index: number;
};

type Quiz = {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  class_id: string | null;
  question_count?: number;
  time_limit?: number | null;
  show_answers_after?: boolean;
  shuffle_questions?: boolean;
  shuffle_options?: boolean;
  points_per_question?: number;
  scheduled_at?: string | null;
  expires_at?: string | null;
};

const emptyQuestion = (index: number): QuestionDraft => ({
  question_text: "", question_type: "text_input", media_url: "", options: ["", ""], correct_answer: "", order_index: index,
});

const AdminQuizzes = () => {
  const { toast } = useToast();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [classId, setClassId] = useState<string>("");
  const [timeLimit, setTimeLimit] = useState<string>("");
  const [showAnswersAfter, setShowAnswersAfter] = useState(true);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [pointsPerQuestion, setPointsPerQuestion] = useState("100");
  const [questions, setQuestions] = useState<QuestionDraft[]>([emptyQuestion(0)]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [scheduledAt, setScheduledAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [antiCheat, setAntiCheat] = useState(false);

  // View Quiz state
  const [viewQuiz, setViewQuiz] = useState<Quiz | null>(null);
  const [viewQuestions, setViewQuestions] = useState<QuestionDraft[]>([]);
  const [viewLoading, setViewLoading] = useState(false);

  // Recreate state
  const [recreateQuiz, setRecreateQuiz] = useState<Quiz | null>(null);
  const [recreating, setRecreating] = useState(false);
  const [duplicating, setDuplicating] = useState<string | null>(null);

  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data } = await supabase.from("classes").select("id, class_name").eq("is_archived", false).order("class_name");
      return data || [];
    },
  });

  const classMap = Object.fromEntries(classes.map((c) => [c.id, c.class_name]));

  const fetchQuizzes = async () => {
    const { data: quizzesData } = await supabase.from("quizzes").select("*").order("created_at", { ascending: false });
    if (quizzesData) {
      const { data: counts } = await supabase.from("quiz_questions").select("quiz_id");
      const countMap: Record<string, number> = {};
      counts?.forEach((q) => { countMap[q.quiz_id] = (countMap[q.quiz_id] || 0) + 1; });
      setQuizzes(quizzesData.map((q) => ({ ...q, question_count: countMap[q.id] || 0 })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchQuizzes(); }, []);

  const openCreate = () => {
    setEditingQuizId(null); setTitle(""); setDescription(""); setIsActive(false); setClassId("");
    setTimeLimit(""); setShowAnswersAfter(true); setShuffleQuestions(false); setShuffleOptions(false); setPointsPerQuestion("100");
    setScheduledAt(""); setExpiresAt(""); setAntiCheat(false);
    setQuestions([emptyQuestion(0)]); setDialogOpen(true);
  };

  const openEdit = async (quiz: Quiz) => {
    setEditingQuizId(quiz.id); setTitle(quiz.title); setDescription(quiz.description || ""); setIsActive(quiz.is_active); setClassId(quiz.class_id || "");
    setTimeLimit(quiz.time_limit?.toString() || ""); setShowAnswersAfter(quiz.show_answers_after ?? true);
    setShuffleQuestions(quiz.shuffle_questions ?? false); setShuffleOptions(quiz.shuffle_options ?? false);
    setPointsPerQuestion((quiz.points_per_question ?? 100).toString());
    setScheduledAt(quiz.scheduled_at ? new Date(quiz.scheduled_at).toISOString().slice(0, 16) : "");
    setExpiresAt(quiz.expires_at ? new Date(quiz.expires_at).toISOString().slice(0, 16) : "");
    setAntiCheat((quiz as any).anti_cheat ?? false);
    const { data } = await supabase.from("quiz_questions").select("*").eq("quiz_id", quiz.id).order("order_index");
    if (data && data.length > 0) {
      setQuestions(data.map((q) => ({ id: q.id, question_text: q.question_text, question_type: q.question_type as any, media_url: q.media_url || "", options: (q.options as string[]) || ["", ""], correct_answer: q.correct_answer || "", order_index: q.order_index })));
    } else { setQuestions([emptyQuestion(0)]); }
    setDialogOpen(true);
  };

  // View Quiz handler
  const handleView = async (quiz: Quiz) => {
    setViewQuiz(quiz);
    setViewLoading(true);
    const { data } = await supabase.from("quiz_questions").select("*").eq("quiz_id", quiz.id).order("order_index");
    setViewQuestions(
      data?.map((q) => ({
        question_text: q.question_text,
        question_type: q.question_type as any,
        media_url: q.media_url || "",
        options: (q.options as string[]) || [],
        correct_answer: q.correct_answer || "",
        order_index: q.order_index,
      })) || []
    );
    setViewLoading(false);
  };

  // Duplicate Quiz handler
  const handleDuplicate = async (quiz: Quiz) => {
    setDuplicating(quiz.id);
    try {
      const { data: questionsData } = await supabase.from("quiz_questions").select("*").eq("quiz_id", quiz.id).order("order_index");
      const { data: newQuiz, error } = await supabase.from("quizzes").insert({
        title: `(Copy) ${quiz.title}`,
        description: quiz.description,
        is_active: false,
        class_id: quiz.class_id,
        time_limit: quiz.time_limit ?? null,
        show_answers_after: quiz.show_answers_after ?? true,
        shuffle_questions: quiz.shuffle_questions ?? false,
        shuffle_options: quiz.shuffle_options ?? false,
        points_per_question: quiz.points_per_question ?? 100,
        scheduled_at: null,
        expires_at: null,
      }).select().single();

      if (error || !newQuiz) throw error;

      if (questionsData?.length) {
        await supabase.from("quiz_questions").insert(
          questionsData.map((q, i) => ({
            quiz_id: newQuiz.id,
            question_text: q.question_text,
            question_type: q.question_type,
            media_url: q.media_url,
            options: q.options,
            correct_answer: q.correct_answer,
            order_index: i,
          }))
        );
      }
      toast({ title: "Quiz duplicated!", description: `"${newQuiz.title}" created as draft.` });
      fetchQuizzes();
    } catch {
      toast({ title: "Failed to duplicate quiz", variant: "destructive" });
    }
    setDuplicating(null);
  };

  // Recreate Quiz with AI handler
  const handleRecreate = async () => {
    if (!recreateQuiz) return;
    setRecreating(true);
    try {
      const { data: questionsData } = await supabase.from("quiz_questions").select("*").eq("quiz_id", recreateQuiz.id).order("order_index");
      const numQuestions = questionsData?.length || 5;
      const questionType = questionsData?.[0]?.question_type || "multiple_choice";
      const topic = `${recreateQuiz.title}${recreateQuiz.description ? ` - ${recreateQuiz.description}` : ""}`;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast({ title: "Session expired, please login again", variant: "destructive" }); setRecreating(false); return; }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-quiz`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ topic, num_questions: numQuestions, question_type: questionType, language: "English" }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.questions?.length) {
        toast({ title: data.error || "Failed to generate new questions", variant: "destructive" });
        setRecreating(false);
        return;
      }

      // Delete old questions and insert new ones
      await supabase.from("quiz_questions").delete().eq("quiz_id", recreateQuiz.id);
      const newRows = data.questions.map((q: any, i: number) => ({
        quiz_id: recreateQuiz.id,
        question_text: q.question_text || "",
        question_type: q.question_type || questionType,
        media_url: q.media_url || null,
        options: q.options || null,
        correct_answer: q.correct_answer || null,
        order_index: i,
      }));
      await supabase.from("quiz_questions").insert(newRows);

      toast({ title: `${data.questions.length} new questions generated!`, description: `Model: ${data.model_used}` });
      setRecreateQuiz(null);
      fetchQuizzes();
    } catch (e) {
      console.error(e);
      toast({ title: "Error recreating quiz", variant: "destructive" });
    }
    setRecreating(false);
  };

  const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion(prev.length)]);
  const removeQuestion = (index: number) => setQuestions((prev) => prev.filter((_, i) => i !== index).map((q, i) => ({ ...q, order_index: i })));
  const updateQuestion = (index: number, field: keyof QuestionDraft, value: any) => setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, [field]: value } : q)));
  const updateOption = (qIndex: number, oIndex: number, value: string) => setQuestions((prev) => prev.map((q, i) => i === qIndex ? { ...q, options: q.options.map((o, j) => (j === oIndex ? value : o)) } : q));
  const addOption = (qIndex: number) => setQuestions((prev) => prev.map((q, i) => i === qIndex ? { ...q, options: [...q.options, ""] } : q));
  const removeOption = (qIndex: number, oIndex: number) => setQuestions((prev) => prev.map((q, i) => i === qIndex ? { ...q, options: q.options.filter((_, j) => j !== oIndex) } : q));

  const handleSave = async () => {
    if (!title.trim()) { toast({ title: "Title is required", variant: "destructive" }); return; }
    if (questions.some((q) => !q.question_text.trim())) { toast({ title: "All questions need text", variant: "destructive" }); return; }
    setSaving(true);
    try {
      let quizId = editingQuizId;
      if (editingQuizId) {
        await supabase.from("quizzes").update({
          title, description: description || null, is_active: isActive, class_id: classId || null,
          time_limit: timeLimit ? parseInt(timeLimit) : null, show_answers_after: showAnswersAfter,
          shuffle_questions: shuffleQuestions, shuffle_options: shuffleOptions,
          points_per_question: parseInt(pointsPerQuestion) || 100,
          scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
          anti_cheat: antiCheat,
        }).eq("id", editingQuizId);
        await supabase.from("quiz_questions").delete().eq("quiz_id", editingQuizId);
      } else {
        const { data } = await supabase.from("quizzes").insert({
          title, description: description || null, is_active: isActive, class_id: classId || null,
          time_limit: timeLimit ? parseInt(timeLimit) : null, show_answers_after: showAnswersAfter,
          shuffle_questions: shuffleQuestions, shuffle_options: shuffleOptions,
          points_per_question: parseInt(pointsPerQuestion) || 100,
          scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        }).select().single();
        quizId = data!.id;
      }
      const questionRows = questions.map((q, i) => ({ quiz_id: quizId!, question_text: q.question_text, question_type: q.question_type, media_url: q.media_url || null, options: q.question_type === "multiple_choice" ? q.options : null, correct_answer: q.correct_answer || null, order_index: i }));
      await supabase.from("quiz_questions").insert(questionRows);
      toast({ title: editingQuizId ? "Quiz updated!" : "Quiz created!" });
      setDialogOpen(false); fetchQuizzes();
    } catch { toast({ title: "Error saving quiz", variant: "destructive" }); }
    setSaving(false);
  };

  const handleDelete = async () => { if (!deleteId) return; await supabase.from("quizzes").delete().eq("id", deleteId); setDeleteId(null); toast({ title: "Quiz deleted" }); fetchQuizzes(); };
  const toggleActive = async (quiz: Quiz) => { await supabase.from("quizzes").update({ is_active: !quiz.is_active }).eq("id", quiz.id); fetchQuizzes(); };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div><h2 className="font-display font-bold text-2xl">Quizzes</h2><p className="text-muted-foreground mt-1 text-sm">Create and manage quizzes</p></div>
          <div className="flex items-center gap-2 flex-wrap">
            <ApiKeyManager />
            <Button onClick={openCreate} className="rounded-xl gap-2"><Plus className="w-4 h-4" /> New Quiz</Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : quizzes.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center space-y-2">
            <ClipboardList className="w-10 h-10 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">No quizzes yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="glass rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold truncate">{quiz.title}</h3>
                    <Badge variant={quiz.is_active ? "default" : "secondary"} className="text-[10px]">{quiz.is_active ? "Active" : "Draft"}</Badge>
                    {quiz.class_id && classMap[quiz.class_id] && (
                      <Badge variant="outline" className="text-[10px]">{classMap[quiz.class_id]}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{quiz.question_count} question{quiz.question_count !== 1 ? "s" : ""}</p>
                  <div className="flex gap-1 flex-wrap mt-0.5">
                    {quiz.scheduled_at && <Badge variant="outline" className="text-[9px]">📅 {new Date(quiz.scheduled_at).toLocaleDateString()}</Badge>}
                    {quiz.expires_at && <Badge variant={new Date(quiz.expires_at) < new Date() ? "destructive" : "outline"} className="text-[9px]">⏰ {new Date(quiz.expires_at).toLocaleDateString()}</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Switch checked={quiz.is_active} onCheckedChange={() => toggleActive(quiz)} />
                  <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => handleView(quiz)} title="View Quiz"><Eye className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => handleDuplicate(quiz)} disabled={duplicating === quiz.id} title="Duplicate Quiz">
                    {duplicating === quiz.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-xl text-primary" onClick={() => setRecreateQuiz(quiz)} title="Recreate with AI"><Sparkles className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => openEdit(quiz)} title="Edit Quiz"><Edit className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="rounded-xl text-destructive" onClick={() => setDeleteId(quiz.id)} title="Delete Quiz"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingQuizId ? "Edit Quiz" : "Create Quiz"}</DialogTitle>
            <DialogDescription>Fill in quiz details and add questions below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Quiz title" /></div>
            <div className="space-y-2"><Label>Description (optional)</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description" rows={2} /></div>
            <div className="space-y-2">
              <Label>Class (optional)</Label>
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger><SelectValue placeholder="All classes" /></SelectTrigger>
                <SelectContent>{classes.map((c) => (<SelectItem key={c.id} value={c.id}>{c.class_name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2"><Switch checked={isActive} onCheckedChange={setIsActive} /><Label>Active (visible to students)</Label></div>

            {/* Scheduling */}
            <div className="border-t border-border pt-4 space-y-3">
              <h4 className="font-semibold text-sm">📅 Scheduling</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Scheduled At (optional)</Label>
                  <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Expires At (optional)</Label>
                  <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="h-8 text-xs" />
                </div>
              </div>
            </div>

            {/* Gamification Settings */}
            <div className="border-t border-border pt-4 space-y-3">
              <h4 className="font-semibold text-sm">⚡ Quiz Settings</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Timer per question (seconds)</Label>
                  <Input type="number" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} placeholder="No timer" className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Points per question</Label>
                  <Input type="number" value={pointsPerQuestion} onChange={(e) => setPointsPerQuestion(e.target.value)} placeholder="100" className="h-8 text-xs" />
                </div>
              </div>
              <div className="flex items-center gap-2"><Switch checked={showAnswersAfter} onCheckedChange={setShowAnswersAfter} /><Label className="text-xs">Show correct answer after each question</Label></div>
              <div className="flex items-center gap-2"><Switch checked={shuffleQuestions} onCheckedChange={setShuffleQuestions} /><Label className="text-xs">Shuffle question order</Label></div>
              <div className="flex items-center gap-2"><Switch checked={shuffleOptions} onCheckedChange={setShuffleOptions} /><Label className="text-xs">Shuffle MCQ options</Label></div>
            </div>
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between mb-3 gap-2">
                <h4 className="font-semibold text-sm">Questions</h4>
                <div className="flex items-center gap-1.5">
                  <AiQuizGenerator onGenerated={(generated) => setQuestions(generated.map((q, i) => ({ ...q, id: undefined, order_index: i })))} />
                  <Button variant="outline" size="sm" onClick={addQuestion} className="gap-1 rounded-xl text-xs"><Plus className="w-3 h-3" /> Add Question</Button>
                </div>
              </div>
              <div className="space-y-4">
                {questions.map((q, qIdx) => (
                  <div key={qIdx} className="rounded-xl border border-border bg-muted/30 p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><GripVertical className="w-4 h-4 text-muted-foreground" /><span className="text-xs font-semibold text-muted-foreground">Q{qIdx + 1}</span></div>
                      {questions.length > 1 && (<Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeQuestion(qIdx)}><Trash2 className="w-3 h-3" /></Button>)}
                    </div>
                    <Textarea value={q.question_text} onChange={(e) => updateQuestion(qIdx, "question_text", e.target.value)} placeholder="Enter question..." rows={2} className="text-sm" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Type</Label>
                        <Select value={q.question_type} onValueChange={(v) => updateQuestion(qIdx, "question_type", v)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="text_input">Text Input</SelectItem><SelectItem value="multiple_choice">Multiple Choice</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs flex items-center gap-1"><Image className="w-3 h-3" /> Media URL</Label>
                        <Input value={q.media_url} onChange={(e) => updateQuestion(qIdx, "media_url", e.target.value)} placeholder="Audio/Image link" className="h-8 text-xs" />
                      </div>
                    </div>
                    {q.question_type === "multiple_choice" && (
                      <div className="space-y-2">
                        <Label className="text-xs">Options</Label>
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-2">
                            <input type="radio" name={`correct-${qIdx}`} checked={q.correct_answer === opt && opt !== ""} onChange={() => updateQuestion(qIdx, "correct_answer", opt)} className="accent-primary" />
                            <Input value={opt} onChange={(e) => { if (q.correct_answer === opt) updateQuestion(qIdx, "correct_answer", e.target.value); updateOption(qIdx, oIdx, e.target.value); }} placeholder={`Option ${oIdx + 1}`} className="h-8 text-xs flex-1" />
                            {q.options.length > 2 && (<Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeOption(qIdx, oIdx)}><Trash2 className="w-3 h-3" /></Button>)}
                          </div>
                        ))}
                        <Button variant="ghost" size="sm" onClick={() => addOption(qIdx)} className="text-xs">+ Add Option</Button>
                      </div>
                    )}
                    {q.question_type === "text_input" && (
                      <div className="space-y-1"><Label className="text-xs">Expected Answer (optional)</Label><Input value={q.correct_answer} onChange={(e) => updateQuestion(qIdx, "correct_answer", e.target.value)} placeholder="Reference answer" className="h-8 text-xs" /></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}{editingQuizId ? "Update Quiz" : "Create Quiz"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Quiz Dialog */}
      <Dialog open={!!viewQuiz} onOpenChange={(open) => !open && setViewQuiz(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Eye className="w-4 h-4" /> {viewQuiz?.title}</DialogTitle>
            <DialogDescription>{viewQuiz?.description || "No description"}</DialogDescription>
          </DialogHeader>
          {viewQuiz && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant={viewQuiz.is_active ? "default" : "secondary"}>{viewQuiz.is_active ? "Active" : "Draft"}</Badge>
                {viewQuiz.class_id && classMap[viewQuiz.class_id] && <Badge variant="outline">{classMap[viewQuiz.class_id]}</Badge>}
                {viewQuiz.time_limit && <Badge variant="outline">⏱ {viewQuiz.time_limit}s/question</Badge>}
                {viewQuiz.points_per_question && <Badge variant="outline">⭐ {viewQuiz.points_per_question} pts</Badge>}
                {viewQuiz.shuffle_questions && <Badge variant="outline">🔀 Shuffle Q</Badge>}
                {viewQuiz.shuffle_options && <Badge variant="outline">🔀 Shuffle Opt</Badge>}
              </div>
              {(viewQuiz.scheduled_at || viewQuiz.expires_at) && (
                <div className="flex gap-2 flex-wrap text-xs text-muted-foreground">
                  {viewQuiz.scheduled_at && <span>📅 Starts: {new Date(viewQuiz.scheduled_at).toLocaleString()}</span>}
                  {viewQuiz.expires_at && <span>⏰ Expires: {new Date(viewQuiz.expires_at).toLocaleString()}</span>}
                </div>
              )}

              <div className="border-t border-border pt-3">
                <h4 className="font-semibold text-sm mb-3">Questions ({viewQuestions.length})</h4>
                {viewLoading ? (
                  <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
                ) : viewQuestions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No questions in this quiz.</p>
                ) : (
                  <div className="space-y-3">
                    {viewQuestions.map((q, i) => (
                      <div key={i} className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-bold text-muted-foreground mt-0.5">Q{i + 1}</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{q.question_text}</p>
                            <Badge variant="outline" className="text-[9px] mt-1">{q.question_type === "multiple_choice" ? "Multiple Choice" : "Text Input"}</Badge>
                          </div>
                        </div>
                        {q.question_type === "multiple_choice" && q.options.length > 0 && (
                          <div className="ml-6 space-y-1">
                            {q.options.map((opt, j) => (
                              <div key={j} className={`text-xs px-2 py-1 rounded-lg ${opt === q.correct_answer ? "bg-primary/10 text-primary font-semibold border border-primary/20" : "text-muted-foreground"}`}>
                                {String.fromCharCode(65 + j)}. {opt} {opt === q.correct_answer && " ✓"}
                              </div>
                            ))}
                          </div>
                        )}
                        {q.question_type === "text_input" && q.correct_answer && (
                          <div className="ml-6 text-xs text-primary font-medium">Answer: {q.correct_answer}</div>
                        )}
                        {q.media_url && <div className="ml-6 text-xs text-muted-foreground">📎 {q.media_url}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Recreate Confirmation */}
      <AlertDialog open={!!recreateQuiz} onOpenChange={(open) => !open && setRecreateQuiz(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Recreate Quiz with AI?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace <strong>all existing questions</strong> in "{recreateQuiz?.title}" with new AI-generated questions on the same topic. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={recreating}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRecreate} disabled={recreating} className="gap-2">
              {recreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {recreating ? "Generating..." : "Recreate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Quiz?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this quiz and all its questions.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminQuizzes;
