import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, FileCheck, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const AdminAssignments = () => {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [classId, setClassId] = useState("");
  const [dueDate, setDueDate] = useState<Date>();
  const [maxScore, setMaxScore] = useState("100");
  const [viewSubs, setViewSubs] = useState<string | null>(null);
  const [gradeDialog, setGradeDialog] = useState<{ id: string; score: string; feedback: string } | null>(null);

  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data } = await supabase.from("classes").select("id, class_name").eq("is_archived", false);
      return data || [];
    },
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["admin-assignments"],
    queryFn: async () => {
      const { data } = await supabase.from("assignments").select("*, classes(class_name)").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ["assignment-submissions", viewSubs],
    queryFn: async () => {
      if (!viewSubs) return [];
      const { data } = await supabase.from("assignment_submissions").select("*, profiles:student_id(full_name)").eq("assignment_id", viewSubs);
      return data || [];
    },
    enabled: !!viewSubs,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("assignments").insert({
        title, description: description || null, class_id: classId,
        due_date: dueDate?.toISOString() || null, max_score: Number(maxScore) || 100,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-assignments"] });
      setShowCreate(false);
      setTitle(""); setDescription(""); setClassId(""); setDueDate(undefined); setMaxScore("100");
      toast.success("Assignment created!");
    },
    onError: () => toast.error("Failed to create assignment"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("assignments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-assignments"] });
      toast.success("Assignment deleted");
    },
  });

  const gradeMutation = useMutation({
    mutationFn: async () => {
      if (!gradeDialog) return;
      const { error } = await supabase.from("assignment_submissions").update({
        score: Number(gradeDialog.score), feedback: gradeDialog.feedback || null, status: "graded",
      }).eq("id", gradeDialog.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignment-submissions", viewSubs] });
      setGradeDialog(null);
      toast.success("Graded!");
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-2xl">Assignments</h2>
            <p className="text-muted-foreground mt-1">Create tasks with deadlines and file submissions</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="rounded-xl gap-2"><Plus className="w-4 h-4" /> New</Button>
        </div>

        {assignments.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <FileCheck className="w-10 h-10 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium mt-2">No assignments yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map((a: any) => (
              <div key={a.id} className="glass rounded-2xl p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-display font-bold text-sm truncate">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.classes?.class_name || "No class"}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8" onClick={() => setViewSubs(a.id)}>
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(a.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {a.due_date && <Badge variant="outline" className="text-[10px]">Due: {format(new Date(a.due_date), "MMM d, yyyy")}</Badge>}
                  <Badge variant="secondary" className="text-[10px]">Max: {a.max_score}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle className="font-display">New Assignment</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className="rounded-xl" />
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description..." className="rounded-xl" />
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select class" /></SelectTrigger>
              <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.class_name}</SelectItem>)}</SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full rounded-xl justify-start text-left font-normal", !dueDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />{dueDate ? format(dueDate, "PPP") : "Pick due date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
            <Input value={maxScore} onChange={e => setMaxScore(e.target.value)} placeholder="Max Score" type="number" className="rounded-xl" />
          </div>
          <DialogFooter>
            <Button onClick={() => createMutation.mutate()} disabled={!title.trim() || !classId} className="rounded-xl w-full">Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submissions Dialog */}
      <Dialog open={!!viewSubs} onOpenChange={() => setViewSubs(null)}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader><DialogTitle className="font-display">Submissions</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {submissions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No submissions yet</p>
            ) : submissions.map((s: any) => (
              <div key={s.id} className="glass rounded-xl p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{s.profiles?.full_name || "Student"}</p>
                  <Badge variant={s.status === "graded" ? "default" : "secondary"} className="text-[10px]">{s.status}</Badge>
                </div>
                {s.file_url && <a href={s.file_url} target="_blank" rel="noopener" className="text-xs text-primary underline">View File</a>}
                {s.note && <p className="text-xs text-muted-foreground">{s.note}</p>}
                {s.status !== "graded" && (
                  <Button size="sm" variant="outline" className="rounded-lg text-xs mt-1" onClick={() => setGradeDialog({ id: s.id, score: "", feedback: "" })}>
                    Grade
                  </Button>
                )}
                {s.status === "graded" && <p className="text-xs font-bold text-primary">Score: {s.score}</p>}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Grade Dialog */}
      <Dialog open={!!gradeDialog} onOpenChange={() => setGradeDialog(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle className="font-display">Grade Submission</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <Input value={gradeDialog?.score || ""} onChange={e => setGradeDialog(prev => prev ? { ...prev, score: e.target.value } : null)} placeholder="Score" type="number" className="rounded-xl" />
            <Textarea value={gradeDialog?.feedback || ""} onChange={e => setGradeDialog(prev => prev ? { ...prev, feedback: e.target.value } : null)} placeholder="Feedback..." className="rounded-xl" />
          </div>
          <DialogFooter>
            <Button onClick={() => gradeMutation.mutate()} disabled={!gradeDialog?.score} className="rounded-xl w-full">Save Grade</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminAssignments;
