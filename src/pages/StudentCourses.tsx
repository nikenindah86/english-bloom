import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import StudentLayout from "@/components/student/StudentLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Layers, CheckCircle2 } from "lucide-react";

const StudentCourses = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["student-courses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select("*").eq("is_published", true);
      if (error) throw error;
      return data;
    },
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ["student-all-lessons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("lessons").select("id, course_id");
      if (error) throw error;
      return data;
    },
  });

  const { data: completions = [] } = useQuery({
    queryKey: ["student-completions"],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from("lesson_completions").select("lesson_id").eq("student_id", user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const completedSet = new Set(completions.map((c) => c.lesson_id));

  const getCourseProgress = (courseId: string) => {
    const courseLessons = lessons.filter((l) => l.course_id === courseId);
    const completed = courseLessons.filter((l) => completedSet.has(l.id)).length;
    return { total: courseLessons.length, completed };
  };

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">My Courses</h1>
          <p className="text-sm text-muted-foreground">Browse and continue your learning</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => <Card key={i} className="animate-pulse h-36 rounded-2xl" />)}
          </div>
        ) : courses.length === 0 ? (
          <Card className="rounded-2xl border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground font-medium">No courses available</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {courses.map((course: any) => {
              const { total, completed } = getCourseProgress(course.id);
              const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
              const isDone = total > 0 && completed === total;
              return (
                <Card key={course.id} className="rounded-2xl hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/student/courses/${course.id}`)}>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
                        <BookOpen className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-bold text-base truncate">{course.title}</h3>
                        {course.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{course.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="rounded-lg text-[10px] gap-1"><Layers className="w-3 h-3" />{total} lessons</Badge>
                      {isDone && <Badge className="rounded-lg text-[10px] gap-1 bg-emerald-100 text-emerald-700 border-0"><CheckCircle2 className="w-3 h-3" />Complete</Badge>}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>{completed}/{total} completed</span>
                        <span>{pct}%</span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentCourses;
