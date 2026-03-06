import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import StudentLayout from "@/components/student/StudentLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Layers, CheckCircle2, Search, ChevronLeft, ChevronRight } from "lucide-react";

const ITEMS_PER_PAGE = 10;

const StudentCourses = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("title");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);

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

  const filtered = useMemo(() => {
    let result = courses.filter((course: any) => {
      const matchSearch = !search || course.title?.toLowerCase().includes(search.toLowerCase()) || course.description?.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (filterStatus === "all") return true;
      const { total, completed } = getCourseProgress(course.id);
      if (filterStatus === "completed") return total > 0 && completed === total;
      if (filterStatus === "in_progress") return completed > 0 && completed < total;
      if (filterStatus === "not_started") return completed === 0;
      return true;
    });
    result.sort((a: any, b: any) => {
      if (sortBy === "title") return (a.title || "").localeCompare(b.title || "");
      if (sortBy === "progress") {
        const pa = getCourseProgress(a.id);
        const pb = getCourseProgress(b.id);
        const pctA = pa.total > 0 ? pa.completed / pa.total : 0;
        const pctB = pb.total > 0 ? pb.completed / pb.total : 0;
        return pctB - pctA;
      }
      if (sortBy === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return 0;
    });
    return result;
  }, [courses, lessons, completions, search, sortBy, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  useEffect(() => { setPage(1); }, [search, sortBy, filterStatus]);

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">My Courses</h1>
          <p className="text-sm text-muted-foreground">Browse and continue your learning</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search courses..." className="pl-9 rounded-xl text-sm" />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-36 rounded-xl text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="title">Title A-Z</SelectItem>
              <SelectItem value="progress">Progress</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-36 rounded-xl text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="not_started">Not Started</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => <Card key={i} className="animate-pulse h-36 rounded-2xl" />)}
          </div>
        ) : paginated.length === 0 ? (
          <Card className="rounded-2xl border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground font-medium">{search || filterStatus !== "all" ? "No courses match your filter" : "No courses available"}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {paginated.map((course: any) => {
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

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </Button>
            <span className="text-xs text-muted-foreground">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              Next <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentCourses;
