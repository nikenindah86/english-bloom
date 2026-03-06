import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Copy, NotebookPen } from "lucide-react";

interface LessonPlan {
  id: string;
  class_id: string;
  title: string;
  week_number: number | null;
  date_start: string | null;
  date_end: string | null;
  topic: string;
  learning_objectives: string;
  core_competencies: string | null;
  materials_resources: string | null;
  opening_activity: string | null;
  main_activity: string | null;
  closing_activity: string | null;
  assessment_method: string | null;
  time_allocation: string | null;
  notes: string | null;
  status: string;
  created_at: string;
}

const emptyForm = {
  class_id: "",
  title: "",
  week_number: "",
  date_start: "",
  date_end: "",
  topic: "",
  learning_objectives: "",
  core_competencies: "",
  materials_resources: "",
  opening_activity: "",
  main_activity: "",
  closing_activity: "",
  assessment_method: "",
  time_allocation: "",
  notes: "",
  status: "draft",
};

const AdminLessonPlans = () => {
  const qc = useQueryClient();
  const [filterClass, setFilterClass] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("classes").select("id, class_name").eq("is_archived", false).order("class_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["lesson-plans", filterClass],
    queryFn: async () => {
      let q = supabase.from("lesson_plans").select("*").order("created_at", { ascending: false });
      if (filterClass !== "all") q = q.eq("class_id", filterClass);
      const { data, error } = await q;
      if (error) throw error;
      return data as LessonPlan[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        class_id: form.class_id,
        title: form.title,
        week_number: form.week_number ? parseInt(form.week_number) : null,
        date_start: form.date_start || null,
        date_end: form.date_end || null,
        topic: form.topic,
        learning_objectives: form.learning_objectives,
        core_competencies: form.core_competencies || null,
        materials_resources: form.materials_resources || null,
        opening_activity: form.opening_activity || null,
        main_activity: form.main_activity || null,
        closing_activity: form.closing_activity || null,
        assessment_method: form.assessment_method || null,
        time_allocation: form.time_allocation || null,
        notes: form.notes || null,
        status: form.status,
      };
      if (editingId) {
        const { error } = await supabase.from("lesson_plans").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("lesson_plans").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lesson-plans"] });
      setDialogOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      toast({ title: editingId ? "Plan updated" : "Plan created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lesson_plans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lesson-plans"] });
      setDeleteId(null);
      toast({ title: "Plan deleted" });
    },
  });

  const openEdit = (plan: LessonPlan) => {
    setEditingId(plan.id);
    setForm({
      class_id: plan.class_id,
      title: plan.title,
      week_number: plan.week_number?.toString() || "",
      date_start: plan.date_start || "",
      date_end: plan.date_end || "",
      topic: plan.topic,
      learning_objectives: plan.learning_objectives,
      core_competencies: plan.core_competencies || "",
      materials_resources: plan.materials_resources || "",
      opening_activity: plan.opening_activity || "",
      main_activity: plan.main_activity || "",
      closing_activity: plan.closing_activity || "",
      assessment_method: plan.assessment_method || "",
      time_allocation: plan.time_allocation || "",
      notes: plan.notes || "",
      status: plan.status,
    });
    setDialogOpen(true);
  };

  const duplicate = (plan: LessonPlan) => {
    setEditingId(null);
    setForm({
      class_id: plan.class_id,
      title: plan.title + " (Copy)",
      week_number: plan.week_number ? (plan.week_number + 1).toString() : "",
      date_start: "",
      date_end: "",
      topic: plan.topic,
      learning_objectives: plan.learning_objectives,
      core_competencies: plan.core_competencies || "",
      materials_resources: plan.materials_resources || "",
      opening_activity: plan.opening_activity || "",
      main_activity: plan.main_activity || "",
      closing_activity: plan.closing_activity || "",
      assessment_method: plan.assessment_method || "",
      time_allocation: plan.time_allocation || "",
      notes: plan.notes || "",
      status: "draft",
    });
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const className = (id: string) => classes.find((c) => c.id === id)?.class_name || "—";

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-display font-bold text-2xl flex items-center gap-2">
              <NotebookPen className="w-6 h-6" /> Lesson Plans
            </h2>
            <p className="text-muted-foreground text-sm mt-1">Create and manage weekly lesson plans</p>
          </div>
          <Button onClick={openCreate} className="rounded-xl">
            <Plus className="w-4 h-4 mr-1" /> New Plan
          </Button>
        </div>

        {/* Filter */}
        <Select value={filterClass} onValueChange={setFilterClass}>
          <SelectTrigger className="w-full sm:w-48 rounded-xl">
            <SelectValue placeholder="All Classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.class_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* List */}
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : plans.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-muted-foreground">
            <NotebookPen className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>No lesson plans yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {plans.map((plan) => (
              <div key={plan.id} className="glass rounded-2xl p-5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold truncate">{plan.title}</h3>
                    <p className="text-xs text-muted-foreground">{className(plan.class_id)}{plan.week_number ? ` · Week ${plan.week_number}` : ""}</p>
                  </div>
                  <Badge variant={plan.status === "published" ? "default" : "secondary"} className="shrink-0">
                    {plan.status}
                  </Badge>
                </div>
                {plan.topic && <p className="text-sm text-muted-foreground line-clamp-2">Topic: {plan.topic}</p>}
                {plan.time_allocation && <p className="text-xs text-muted-foreground">{plan.time_allocation}</p>}
                <div className="flex gap-1 pt-1">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(plan)} className="rounded-lg"><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => duplicate(plan)} className="rounded-lg"><Copy className="w-3.5 h-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleteId(plan.id)} className="rounded-lg text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Lesson Plan" : "New Lesson Plan"}</DialogTitle>
            <DialogDescription>Fill in the structured lesson plan details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Row 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Class *</Label>
                <Select value={form.class_id} onValueChange={(v) => set("class_id", v)}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.class_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Title *</Label>
              <Input className="rounded-xl" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Week 3 – Present Perfect Tense" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label>Week #</Label>
                <Input className="rounded-xl" type="number" value={form.week_number} onChange={(e) => set("week_number", e.target.value)} />
              </div>
              <div>
                <Label>Start Date</Label>
                <Input className="rounded-xl" type="date" value={form.date_start} onChange={(e) => set("date_start", e.target.value)} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input className="rounded-xl" type="date" value={form.date_end} onChange={(e) => set("date_end", e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Topic *</Label>
              <Input className="rounded-xl" value={form.topic} onChange={(e) => set("topic", e.target.value)} placeholder="Main topic or theme" />
            </div>
            <div>
              <Label>Time Allocation</Label>
              <Input className="rounded-xl" value={form.time_allocation} onChange={(e) => set("time_allocation", e.target.value)} placeholder="e.g. 2 x 45 minutes" />
            </div>
            <div>
              <Label>Learning Objectives *</Label>
              <Textarea className="rounded-xl" rows={3} value={form.learning_objectives} onChange={(e) => set("learning_objectives", e.target.value)} placeholder="What students will be able to do after this lesson" />
            </div>
            <div>
              <Label>Core Competencies / Standards</Label>
              <Textarea className="rounded-xl" rows={2} value={form.core_competencies} onChange={(e) => set("core_competencies", e.target.value)} placeholder="KD / curriculum standards" />
            </div>
            <div>
              <Label>Materials & Resources</Label>
              <Textarea className="rounded-xl" rows={2} value={form.materials_resources} onChange={(e) => set("materials_resources", e.target.value)} placeholder="Textbooks, worksheets, media, links" />
            </div>

            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider pt-2">Teaching Activities</p>
            <div>
              <Label>Opening Activity (Warm-up)</Label>
              <Textarea className="rounded-xl" rows={2} value={form.opening_activity} onChange={(e) => set("opening_activity", e.target.value)} placeholder="Ice-breaker, review, lead-in" />
            </div>
            <div>
              <Label>Main Activity</Label>
              <Textarea className="rounded-xl" rows={4} value={form.main_activity} onChange={(e) => set("main_activity", e.target.value)} placeholder="Core lesson steps, practice activities" />
            </div>
            <div>
              <Label>Closing Activity (Wrap-up)</Label>
              <Textarea className="rounded-xl" rows={2} value={form.closing_activity} onChange={(e) => set("closing_activity", e.target.value)} placeholder="Reflection, summary, homework" />
            </div>

            <div>
              <Label>Assessment Method</Label>
              <Textarea className="rounded-xl" rows={2} value={form.assessment_method} onChange={(e) => set("assessment_method", e.target.value)} placeholder="How to evaluate student understanding" />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea className="rounded-xl" rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Additional notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!form.class_id || !form.title || !form.topic || !form.learning_objectives || saveMutation.isPending}
              className="rounded-xl"
            >
              {saveMutation.isPending ? "Saving..." : editingId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Lesson Plan?</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)} className="rounded-xl">Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="rounded-xl">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminLessonPlans;
