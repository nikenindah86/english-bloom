import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import StudentLayout from "@/components/student/StudentLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle2, Circle, Video, PlayCircle } from "lucide-react";

const StudentCourseDetail = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: course } = useQuery({
    queryKey: ["student-course", courseId],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select("*").eq("id", courseId!).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ["student-course-lessons", courseId],
    queryFn: async () => {
      const { data, error } = await supabase.from("lessons").select("*").eq("course_id", courseId!).order("order_index");
      if (error) throw error;
      return data;
    },
  });

  const { data: completions = [] } = useQuery({
    queryKey: ["student-course-completions", courseId],
    queryFn: async () => {
      if (!user) return [];
      const lessonIds = lessons.map((l) => l.id);
      if (lessonIds.length === 0) return [];
      const { data, error } = await supabase.from("lesson_completions").select("lesson_id").eq("student_id", user.id).in("lesson_id", lessonIds);
      if (error) throw error;
      return data;
    },
    enabled: !!user && lessons.length > 0,
  });

  const completedSet = new Set(completions.map((c) => c.lesson_id));
  const completed = lessons.filter((l) => completedSet.has(l.id)).length;
  const pct = lessons.length > 0 ? Math.round((completed / lessons.length) * 100) : 0;

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/student/courses")} className="rounded-xl">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-display font-bold truncate">{course?.title || "Course"}</h1>
            {course?.description && <p className="text-xs text-muted-foreground line-clamp-1">{course.description}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{completed}/{lessons.length} lessons completed</span>
            <span>{pct}%</span>
          </div>
          <Progress value={pct} className="h-2" />
        </div>

        <div className="space-y-2">
          {lessons.map((lesson: any, idx: number) => {
            const done = completedSet.has(lesson.id);
            return (
              <Card
                key={lesson.id}
                className="rounded-2xl hover:shadow-sm transition-shadow cursor-pointer"
                onClick={() => navigate(`/student/courses/${courseId}/lessons/${lesson.id}`)}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="shrink-0">
                    {done ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    ) : (
                      <Circle className="w-6 h-6 text-muted-foreground/30" />
                    )}
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-accent/60 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-accent-foreground">{idx + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{lesson.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {lesson.video_url && <Badge variant="secondary" className="rounded-lg text-[10px] gap-1"><Video className="w-3 h-3" />Video</Badge>}
                    </div>
                  </div>
                  <PlayCircle className="w-5 h-5 text-primary/60 shrink-0" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentCourseDetail;
