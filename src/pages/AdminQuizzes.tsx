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
import { ClipboardList, Plus, Trash2, GripVertical, Image, Edit, Loader2 } from "lucide-react";

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

  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data } = await supabase.from("classes").select("id, class_name").order("class_name");
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
    setEditingQuizId(null); setTitle(""); setDescription(""); setIsActive(false); setClassId(""); setQuestions([emptyQuestion(0)]); setDialogOpen(true);
  };

  const openEdit = async (quiz: Quiz) => {
    setEditingQuizId(quiz.id); setTitle(quiz.title); setDescription(quiz.description || ""); setIsActive(quiz.is_active); setClassId(quiz.class_id || "");
    const { data } = await supabase.from("quiz_questions").select("*").eq("quiz_id", quiz.id).order("order_index");
    if (data && data.length > 0) {
      setQuestions(data.map((q) => ({ id: q.id, question_text: q.question_text, question_type: q.question_type as any, media_url: q.media_url || "", options: (q.options as string[]) || ["", ""], correct_answer: q.correct_answer || "", order_index: q.order_index })));
    } else { setQuestions([emptyQuestion(0)]); }
    setDialogOpen(true);
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
        await supabase.from("quizzes").update({ title, description: description || null, is_active: isActive, class_id: classId || null }).eq("id", editingQuizId);
        await supabase.from("quiz_questions").delete().eq("quiz_id", editingQuizId);
      } else {
        const { data } = await supabase.from("quizzes").insert({ title, description: description || null, is_active: isActive, class_id: classId || null }).select().single();
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
        <div className="flex items-center justify-between">
          <div><h2 className="font-display font-bold text-2xl">Quizzes</h2><p className="text-muted-foreground mt-1">Create and manage quizzes</p></div>
          <Button onClick={openCreate} className="rounded-xl gap-2"><Plus className="w-4 h-4" /> New Quiz</Button>
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
                </div>
                <div className="flex items-center gap-1">
                  <Switch checked={quiz.is_active} onCheckedChange={() => toggleActive(quiz)} />
                  <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => openEdit(quiz)}><Edit className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="rounded-xl text-destructive" onClick={() => setDeleteId(quiz.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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

            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm">Questions</h4>
                <Button variant="outline" size="sm" onClick={addQuestion} className="gap-1 rounded-xl text-xs"><Plus className="w-3 h-3" /> Add Question</Button>
              </div>
              <div className="space-y-4">
                {questions.map((q, qIdx) => (
                  <div key={qIdx} className="rounded-xl border border-border bg-muted/30 p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><GripVertical className="w-4 h-4 text-muted-foreground" /><span className="text-xs font-semibold text-muted-foreground">Q{qIdx + 1}</span></div>
                      {questions.length > 1 && (<Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeQuestion(qIdx)}><Trash2 className="w-3 h-3" /></Button>)}
                    </div>
                    <Textarea value={q.question_text} onChange={(e) => updateQuestion(qIdx, "question_text", e.target.value)} placeholder="Enter question..." rows={2} className="text-sm" />
                    <div className="grid grid-cols-2 gap-2">
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
