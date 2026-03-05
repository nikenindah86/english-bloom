import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PenLine, Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const AdminManualGrades = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [studentId, setStudentId] = useState("");
  const [classId, setClassId] = useState("");
  const [title, setTitle] = useState("");
  const [score, setScore] = useState("");
  const [maxScore, setMaxScore] = useState("100");
  const [feedback, setFeedback] = useState("");
  const [gradeDate, setGradeDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const { data: grades = [], isLoading } = useQuery({
    queryKey: ["manual-grades"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("manual_grades")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: students = [] } = useQuery({
    queryKey: ["all-students"],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "student");
      if (!roles?.length) return [];
      const ids = roles.map((r) => r.user_id);
      const { data } = await supabase.from("profiles").select("id, full_name, class_id").in("id", ids);
      return data || [];
    },
  });

  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data } = await supabase.from("classes").select("id, class_name").order("class_name");
      return data || [];
    },
  });

  // Build student name map
  const studentMap = Object.fromEntries(students.map((s) => [s.id, s.full_name || "Unnamed"]));

  const resetForm = () => {
    setEditingId(null);
    setStudentId("");
    setClassId("");
    setTitle("");
    setScore("");
    setMaxScore("100");
    setFeedback("");
    setGradeDate(format(new Date(), "yyyy-MM-dd"));
  };

  const openCreate = () => { resetForm(); setDialogOpen(true); };
  const openEdit = (g: any) => {
    setEditingId(g.id);
    setStudentId(g.student_id);
    setClassId(g.class_id || "");
    setTitle(g.title);
    setScore(String(g.score));
    setMaxScore(String(g.max_score));
    setFeedback(g.feedback || "");
    setGradeDate(g.grade_date);
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        student_id: studentId,
        class_id: classId || null,
        title,
        score: Number(score),
        max_score: Number(maxScore),
        feedback: feedback || null,
        grade_date: gradeDate,
      };
      if (editingId) {
        const { error } = await supabase.from("manual_grades").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("manual_grades").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manual-grades"] });
      setDialogOpen(false);
      resetForm();
      toast.success(editingId ? "Grade updated!" : "Grade added!");
    },
    onError: () => toast.error("Failed to save grade"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("manual_grades").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manual-grades"] });
      toast.success("Grade deleted");
    },
    onError: () => toast.error("Failed to delete"),
  });

  const filteredStudents = classId
    ? students.filter((s) => s.class_id === classId)
    : students;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-2xl">Manual Grades</h2>
            <p className="text-muted-foreground mt-1">Add grades for assignments, exams, etc.</p>
          </div>
          <Button onClick={openCreate} className="rounded-xl gap-2">
            <Plus className="w-4 h-4" /> Add
          </Button>
        </div>

        {isLoading ? (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-muted-foreground text-sm">Loading...</p>
          </div>
        ) : grades.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center space-y-2">
            <PenLine className="w-10 h-10 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">No manual grades yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {grades.map((g) => (
              <div key={g.id} className="glass rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
                  <span className="font-display font-bold text-sm text-accent-foreground">{g.score}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display font-bold text-sm truncate">{g.title}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {studentMap[g.student_id] || "Unknown"} · {format(new Date(g.grade_date), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8" onClick={() => openEdit(g)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-display">Delete Grade</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently remove this grade entry.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMutation.mutate(g.id)} className="rounded-xl bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); resetForm(); } }}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">{editingId ? "Edit Grade" : "Add Grade"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Class (optional filter)</label>
              <Select value={classId} onValueChange={(v) => { setClassId(v); setStudentId(""); }}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="All classes" /></SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.class_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Student</label>
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>
                  {filteredStudents.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.full_name || "Unnamed"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Midterm Exam" className="rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Score</label>
                <Input type="number" value={score} onChange={(e) => setScore(e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Max Score</label>
                <Input type="number" value={maxScore} onChange={(e) => setMaxScore(e.target.value)} className="rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input type="date" value={gradeDate} onChange={(e) => setGradeDate(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Feedback (optional)</label>
              <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} className="rounded-xl" placeholder="Notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!studentId || !title.trim() || !score || saveMutation.isPending}
              className="rounded-xl w-full"
            >
              {saveMutation.isPending ? "Saving..." : editingId ? "Save Changes" : "Add Grade"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminManualGrades;
