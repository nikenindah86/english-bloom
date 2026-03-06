import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PenLine, Plus, Trash2, Pencil, Save, TableIcon, LayoutList } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type TableRowData = { student_id: string; full_name: string; score: string; feedback: string };

const AdminManualGrades = () => {
  const queryClient = useQueryClient();

  // Card view state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [studentId, setStudentId] = useState("");
  const [classId, setClassId] = useState("");
  const [title, setTitle] = useState("");
  const [score, setScore] = useState("");
  const [maxScore, setMaxScore] = useState("100");
  const [feedback, setFeedback] = useState("");
  const [gradeDate, setGradeDate] = useState(format(new Date(), "yyyy-MM-dd"));

  // Table view state
  const [tClassId, setTClassId] = useState("");
  const [tTitle, setTTitle] = useState("");
  const [tMaxScore, setTMaxScore] = useState("100");
  const [tDate, setTDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [tableRows, setTableRows] = useState<TableRowData[]>([]);

  const { data: grades = [], isLoading } = useQuery({
    queryKey: ["manual-grades"],
    queryFn: async () => {
      const { data, error } = await supabase.from("manual_grades").select("*").order("created_at", { ascending: false });
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

  const studentMap = Object.fromEntries(students.map((s) => [s.id, s.full_name || "Unnamed"]));

  // Populate table rows when class changes
  useEffect(() => {
    if (!tClassId) { setTableRows([]); return; }
    const classStudents = students.filter((s) => s.class_id === tClassId);
    // Pre-fill from existing grades matching title+date
    const rows: TableRowData[] = classStudents.map((s) => {
      const existing = grades.find(
        (g) => g.student_id === s.id && g.title === tTitle && g.grade_date === tDate && g.class_id === tClassId
      );
      return {
        student_id: s.id,
        full_name: s.full_name || "Unnamed",
        score: existing ? String(existing.score) : "",
        feedback: existing?.feedback || "",
      };
    });
    setTableRows(rows);
  }, [tClassId, tTitle, tDate, students, grades]);

  const updateRow = (idx: number, field: "score" | "feedback", value: string) => {
    setTableRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  };

  const bulkSaveMutation = useMutation({
    mutationFn: async () => {
      const validRows = tableRows.filter((r) => r.score.trim() !== "");
      if (!validRows.length) throw new Error("No scores to save");
      const payloads = validRows.map((r) => ({
        student_id: r.student_id,
        class_id: tClassId,
        title: tTitle,
        score: Number(r.score),
        max_score: Number(tMaxScore),
        feedback: r.feedback || null,
        grade_date: tDate,
      }));
      const { error } = await supabase.from("manual_grades").insert(payloads);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manual-grades"] });
      toast.success("All grades saved!");
    },
    onError: (e: any) => toast.error(e.message || "Failed to save"),
  });

  // Card view helpers
  const resetForm = () => { setEditingId(null); setStudentId(""); setClassId(""); setTitle(""); setScore(""); setMaxScore("100"); setFeedback(""); setGradeDate(format(new Date(), "yyyy-MM-dd")); };
  const openCreate = () => { resetForm(); setDialogOpen(true); };
  const openEdit = (g: any) => { setEditingId(g.id); setStudentId(g.student_id); setClassId(g.class_id || ""); setTitle(g.title); setScore(String(g.score)); setMaxScore(String(g.max_score)); setFeedback(g.feedback || ""); setGradeDate(g.grade_date); setDialogOpen(true); };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { student_id: studentId, class_id: classId || null, title, score: Number(score), max_score: Number(maxScore), feedback: feedback || null, grade_date: gradeDate };
      if (editingId) {
        const { error } = await supabase.from("manual_grades").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("manual_grades").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["manual-grades"] }); setDialogOpen(false); resetForm(); toast.success(editingId ? "Grade updated!" : "Grade added!"); },
    onError: () => toast.error("Failed to save grade"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("manual_grades").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["manual-grades"] }); toast.success("Grade deleted"); },
    onError: () => toast.error("Failed to delete"),
  });

  const filteredStudents = classId ? students.filter((s) => s.class_id === classId) : students;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-2xl">Manual Grades</h2>
            <p className="text-muted-foreground mt-1">Add grades for assignments, exams, etc.</p>
          </div>
        </div>

        <Tabs defaultValue="table" className="w-full">
          <TabsList className="rounded-xl">
            <TabsTrigger value="table" className="rounded-xl gap-2"><TableIcon className="w-4 h-4" /> Table Entry</TabsTrigger>
            <TabsTrigger value="cards" className="rounded-xl gap-2"><LayoutList className="w-4 h-4" /> Card View</TabsTrigger>
          </TabsList>

          {/* TABLE ENTRY MODE */}
          <TabsContent value="table" className="space-y-4">
            <div className="glass rounded-2xl p-4 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Class</label>
                  <Select value={tClassId} onValueChange={setTClassId}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.class_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Title</label>
                  <Input value={tTitle} onChange={(e) => setTTitle(e.target.value)} placeholder="e.g. Midterm" className="rounded-xl" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Max Score</label>
                  <Input type="number" value={tMaxScore} onChange={(e) => setTMaxScore(e.target.value)} className="rounded-xl" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Date</label>
                  <Input type="date" value={tDate} onChange={(e) => setTDate(e.target.value)} className="rounded-xl" />
                </div>
              </div>

              {!tClassId ? (
                <div className="text-center py-8 text-muted-foreground text-sm">Select a class to start entering grades</div>
              ) : tableRows.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No students found in this class</div>
              ) : (
                <>
                  <div className="rounded-xl border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-8">#</TableHead>
                          <TableHead>Student Name</TableHead>
                          <TableHead className="w-24">Score</TableHead>
                          <TableHead>Feedback</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tableRows.map((row, idx) => (
                          <TableRow key={row.student_id}>
                            <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                            <TableCell className="font-medium text-sm">{row.full_name}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={row.score}
                                onChange={(e) => updateRow(idx, "score", e.target.value)}
                                className="rounded-lg h-8 text-sm w-20"
                                placeholder="—"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={row.feedback}
                                onChange={(e) => updateRow(idx, "feedback", e.target.value)}
                                className="rounded-lg h-8 text-sm"
                                placeholder="Optional"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={() => bulkSaveMutation.mutate()}
                      disabled={!tTitle.trim() || bulkSaveMutation.isPending || tableRows.every((r) => !r.score.trim())}
                      className="rounded-xl gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {bulkSaveMutation.isPending ? "Saving..." : "Save All Grades"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          {/* CARD VIEW MODE */}
          <TabsContent value="cards" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={openCreate} className="rounded-xl gap-2"><Plus className="w-4 h-4" /> Add</Button>
            </div>
            {isLoading ? (
              <div className="glass rounded-2xl p-8 text-center"><p className="text-muted-foreground text-sm">Loading...</p></div>
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
                      <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8" onClick={() => openEdit(g)}><Pencil className="w-4 h-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
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
          </TabsContent>
        </Tabs>
      </div>

      {/* Single entry dialog */}
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
                <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.class_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Student</label>
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>{filteredStudents.map((s) => <SelectItem key={s.id} value={s.id}>{s.full_name || "Unnamed"}</SelectItem>)}</SelectContent>
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
            <Button onClick={() => saveMutation.mutate()} disabled={!studentId || !title.trim() || !score || saveMutation.isPending} className="rounded-xl w-full">
              {saveMutation.isPending ? "Saving..." : editingId ? "Save Changes" : "Add Grade"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminManualGrades;
