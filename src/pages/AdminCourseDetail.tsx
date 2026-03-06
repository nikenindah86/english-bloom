import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import LessonEditor from "@/components/admin/LessonEditor";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, GripVertical, Pencil, Trash2, Video, FileText } from "lucide-react";
import { toast } from "sonner";

const AdminCourseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);

  const { data: course } = useQuery({
    queryKey: ["course", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select("*, classes(class_name)").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ["course-lessons", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("lessons").select("*").eq("course_id", id!).order("order_index");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { title: string; video_url: string; content: string }) => {
      if (editingLesson) {
        const { error } = await supabase.from("lessons").update({
          title: data.title, video_url: data.video_url || null, content: data.content,
        }).eq("id", editingLesson.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("lessons").insert({
          course_id: id!, title: data.title, video_url: data.video_url || null,
          content: data.content, order_index: lessons.length,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["course-lessons", id] });
      qc.invalidateQueries({ queryKey: ["admin-courses-lesson-counts"] });
      setEditorOpen(false);
      setEditingLesson(null);
      toast.success(editingLesson ? "Lesson updated!" : "Lesson added!");
    },
    onError: () => toast.error("Failed to save lesson"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      const { error } = await supabase.from("lessons").delete().eq("id", lessonId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["course-lessons", id] });
      qc.invalidateQueries({ queryKey: ["admin-courses-lesson-counts"] });
      toast.success("Lesson deleted");
    },
  });

  const openEdit = (lesson: any) => {
    setEditingLesson(lesson);
    setEditorOpen(true);
  };

  const openNew = () => {
    setEditingLesson(null);
    setEditorOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/courses")} className="rounded-xl">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl font-display font-bold">{course?.title || "Course"}</h1>
              <p className="text-xs text-muted-foreground">{lessons.length} lessons · {(course as any)?.classes?.class_name || "No class"}</p>
            </div>
          </div>
          <Button onClick={openNew} className="rounded-xl gap-2"><Plus className="w-4 h-4" /> Add Lesson</Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <Card key={i} className="animate-pulse h-16 rounded-2xl" />)}</div>
        ) : lessons.length === 0 ? (
          <Card className="rounded-2xl border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground font-medium">No lessons yet</p>
              <p className="text-xs text-muted-foreground">Add your first lesson to build the syllabus</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {lessons.map((lesson: any, idx: number) => (
              <Card key={lesson.id} className="rounded-2xl group hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0 hidden sm:block" />
                  <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-accent-foreground">{idx + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{lesson.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {lesson.video_url && <Badge variant="secondary" className="rounded-lg text-[10px] gap-1"><Video className="w-3 h-3" />Video</Badge>}
                      {lesson.content && lesson.content !== "<p></p>" && <Badge variant="outline" className="rounded-lg text-[10px] gap-1"><FileText className="w-3 h-3" />Content</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => openEdit(lesson)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive" onClick={() => deleteMutation.mutate(lesson.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <LessonEditor
        open={editorOpen}
        onOpenChange={(v) => { setEditorOpen(v); if (!v) setEditingLesson(null); }}
        onSave={(data) => saveMutation.mutate(data)}
        initialData={editingLesson ? { title: editingLesson.title, video_url: editingLesson.video_url || "", content: editingLesson.content || "" } : undefined}
        saving={saveMutation.isPending}
      />
    </AdminLayout>
  );
};

export default AdminCourseDetail;
