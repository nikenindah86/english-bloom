import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, BookOpen, Layers, Trash2 } from "lucide-react";
import { toast } from "sonner";

const AdminCourses = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [classId, setClassId] = useState<string>("");

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select("*, classes(class_name)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ["admin-courses-lesson-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("lessons").select("course_id");
      if (error) throw error;
      return data;
    },
  });

  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("classes").select("*").eq("is_archived", false);
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("courses").insert({
        title, description: description || null, class_id: classId || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-courses"] });
      setDialogOpen(false); setTitle(""); setDescription(""); setClassId("");
      toast.success("Course created!");
    },
    onError: () => toast.error("Failed to create course"),
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase.from("courses").update({ is_published: published }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-courses"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("courses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-courses"] });
      toast.success("Course deleted");
    },
  });

  const getLessonCount = (courseId: string) => lessons.filter((l) => l.course_id === courseId).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold">Online Courses</h1>
            <p className="text-sm text-muted-foreground">Create and manage course syllabi</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl gap-2"><Plus className="w-4 h-4" /> New Course</Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-md">
              <DialogHeader><DialogTitle className="font-display">Create Course</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. TOEFL Preparation" /></div>
                <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Course description..." /></div>
                <div>
                  <Label>Assign to Class (optional)</Label>
                  <Select value={classId} onValueChange={setClassId}>
                    <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => (<SelectItem key={c.id} value={c.id}>{c.class_name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => createMutation.mutate()} disabled={!title.trim() || createMutation.isPending} className="w-full rounded-xl">
                  {createMutation.isPending ? "Creating..." : "Create Course"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3].map((i) => (<Card key={i} className="animate-pulse h-32 rounded-2xl" />))}
          </div>
        ) : courses.length === 0 ? (
          <Card className="rounded-2xl border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground font-medium">No courses yet</p>
              <p className="text-xs text-muted-foreground">Create your first course to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {courses.map((course: any) => (
              <Card key={course.id} className="rounded-2xl hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate(`/admin/courses/${course.id}`)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-bold text-base truncate">{course.title}</h3>
                      {course.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{course.description}</p>}
                      <div className="flex items-center gap-2 mt-3">
                        <Badge variant="secondary" className="rounded-lg text-[10px] gap-1">
                          <Layers className="w-3 h-3" />{getLessonCount(course.id)} lessons
                        </Badge>
                        {(course as any).classes?.class_name && (
                          <Badge variant="outline" className="rounded-lg text-[10px]">{(course as any).classes.class_name}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[10px] text-muted-foreground">{course.is_published ? "Published" : "Draft"}</span>
                        <Switch checked={course.is_published} onCheckedChange={(v) => togglePublish.mutate({ id: course.id, published: v })} />
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(course.id); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminCourses;
