import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Users, ClipboardList, FileText, Megaphone, GraduationCap, FileCheck, BookOpen, CheckSquare, Plus, PenTool, NotebookPen, CalendarDays } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const { data: studentCount = 0 } = useQuery({
    queryKey: ["admin-student-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "student");
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: pendingCount = 0 } = useQuery({
    queryKey: ["admin-pending-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("quiz_submissions")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: announcementCount = 0 } = useQuery({
    queryKey: ["admin-announcement-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("announcements")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: materialCount = 0 } = useQuery({
    queryKey: ["admin-material-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("materials")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: classCount = 0 } = useQuery({
    queryKey: ["admin-class-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("classes")
        .select("*", { count: "exact", head: true })
        .eq("is_archived", false);
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: quizCount = 0 } = useQuery({
    queryKey: ["admin-quiz-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("quizzes")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: assignmentCount = 0 } = useQuery({
    queryKey: ["admin-assignment-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("assignments")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: courseCount = 0 } = useQuery({
    queryKey: ["admin-course-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("courses")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: recentQuizSubs = [] } = useQuery({
    queryKey: ["admin-recent-quiz-subs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quiz_submissions")
        .select("id, status, score, created_at, quiz_id, student_id")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      if (!data || data.length === 0) return [];

      const quizIds = [...new Set(data.map((s) => s.quiz_id))];
      const studentIds = [...new Set(data.map((s) => s.student_id))];

      const [quizRes, profileRes] = await Promise.all([
        supabase.from("quizzes").select("id, title").in("id", quizIds),
        supabase.from("profiles").select("id, full_name").in("id", studentIds),
      ]);

      const quizMap = Object.fromEntries((quizRes.data || []).map((q) => [q.id, q.title]));
      const profileMap = Object.fromEntries((profileRes.data || []).map((p) => [p.id, p.full_name]));

      return data.map((s) => ({
        ...s,
        quiz_title: quizMap[s.quiz_id] || "Quiz",
        student_name: profileMap[s.student_id] || "Student",
      }));
    },
  });

  const { data: recentAssignmentSubs = [] } = useQuery({
    queryKey: ["admin-recent-assignment-subs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assignment_submissions")
        .select("id, status, score, submitted_at, assignment_id, student_id")
        .order("submitted_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      if (!data || data.length === 0) return [];

      const assignIds = [...new Set(data.map((s) => s.assignment_id))];
      const studentIds = [...new Set(data.map((s) => s.student_id))];

      const [assignRes, profileRes] = await Promise.all([
        supabase.from("assignments").select("id, title").in("id", assignIds),
        supabase.from("profiles").select("id, full_name").in("id", studentIds),
      ]);

      const assignMap = Object.fromEntries((assignRes.data || []).map((a) => [a.id, a.title]));
      const profileMap = Object.fromEntries((profileRes.data || []).map((p) => [p.id, p.full_name]));

      return data.map((s) => ({
        ...s,
        assignment_title: assignMap[s.assignment_id] || "Assignment",
        student_name: profileMap[s.student_id] || "Student",
      }));
    },
  });

  const stats = [
    { label: "Students", icon: Users, count: studentCount, color: "bg-blush text-primary", path: "/admin/students" },
    { label: "Classes", icon: GraduationCap, count: classCount, color: "bg-accent text-accent-foreground", path: "/admin/classes" },
    { label: "Quizzes", icon: ClipboardList, count: quizCount, color: "bg-lavender text-plum", path: "/admin/quizzes" },
    { label: "Pending", icon: CheckSquare, count: pendingCount, color: "bg-secondary text-secondary-foreground", path: "/admin/grading" },
    { label: "Materials", icon: FileText, count: materialCount, color: "bg-blush text-primary", path: "/admin/materials" },
    { label: "Assignments", icon: FileCheck, count: assignmentCount, color: "bg-accent text-accent-foreground", path: "/admin/assignments" },
    { label: "Courses", icon: BookOpen, count: courseCount, color: "bg-lavender text-plum", path: "/admin/courses" },
    { label: "Announcements", icon: Megaphone, count: announcementCount, color: "bg-secondary text-secondary-foreground", path: "/admin/announcements" },
  ];

  const quickActions = [
    { label: "Create Quiz", icon: ClipboardList, path: "/admin/quizzes" },
    { label: "Add Material", icon: FileText, path: "/admin/materials" },
    { label: "Post Announcement", icon: Megaphone, path: "/admin/announcements" },
    { label: "New Assignment", icon: FileCheck, path: "/admin/assignments" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="font-display font-bold text-2xl">Welcome back! 👋</h2>
          <p className="text-muted-foreground mt-1">Here's your classroom overview</p>
        </div>

        {/* Mobile Icon Grid Menu */}
        <div className="md:hidden">
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Classes", icon: GraduationCap, path: "/admin/classes", bg: "bg-accent" },
              { label: "Students", icon: Users, path: "/admin/students", bg: "bg-secondary" },
              { label: "Materials", icon: FileText, path: "/admin/materials", bg: "bg-blush" },
              { label: "Quizzes", icon: ClipboardList, path: "/admin/quizzes", bg: "bg-lavender" },
              { label: "Assignments", icon: FileCheck, path: "/admin/assignments", bg: "bg-accent" },
              { label: "Assess", icon: PenTool, path: "/admin/assessments", bg: "bg-lavender" },
              { label: "Lessons", icon: NotebookPen, path: "/admin/lesson-plans", bg: "bg-blush" },
              { label: "Schedule", icon: CalendarDays, path: "/admin/schedule", bg: "bg-secondary" },
              { label: "Announce", icon: Megaphone, path: "/admin/announcements", bg: "bg-accent" },
              { label: "Grading", icon: CheckSquare, path: "/admin/grading", bg: "bg-blush" },
              { label: "Courses", icon: BookOpen, path: "/admin/courses", bg: "bg-lavender" },
            ].map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-2xl glass hover:shadow-lg transition-all"
              >
                <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center`}>
                  <item.icon className="w-5 h-5 text-foreground/70" />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="hidden md:block">
          <h3 className="font-display font-semibold text-sm text-muted-foreground mb-3">Quick Actions</h3>
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="glass rounded-2xl p-4 flex items-center gap-3 hover:shadow-lg transition-all text-left group"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Plus className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-semibold truncate">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stats grid */}
        <div>
          <h3 className="font-display font-semibold text-sm text-muted-foreground mb-3">Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <button
                key={stat.label}
                onClick={() => navigate(stat.path)}
                className="glass rounded-2xl p-5 space-y-3 text-left hover:shadow-lg transition-all"
              >
                <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-display">{stat.count}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Quiz Submissions */}
          <div className="glass rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-sm">Recent Quiz Submissions</h3>
              <button onClick={() => navigate("/admin/grading")} className="text-xs text-primary font-semibold hover:underline">
                View all
              </button>
            </div>
            {recentQuizSubs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No submissions yet</p>
            ) : (
              <div className="space-y-3">
                {recentQuizSubs.map((sub: any) => (
                  <div key={sub.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{sub.student_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{sub.quiz_title}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={sub.status === "pending" ? "secondary" : "default"} className="text-[10px]">
                        {sub.status}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(sub.created_at), "dd/MM")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Assignment Submissions */}
          <div className="glass rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-sm">Recent Assignment Submissions</h3>
              <button onClick={() => navigate("/admin/assignments")} className="text-xs text-primary font-semibold hover:underline">
                View all
              </button>
            </div>
            {recentAssignmentSubs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No submissions yet</p>
            ) : (
              <div className="space-y-3">
                {recentAssignmentSubs.map((sub: any) => (
                  <div key={sub.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{sub.student_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{sub.assignment_title}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={sub.status === "submitted" ? "secondary" : "default"} className="text-[10px]">
                        {sub.status}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(sub.submitted_at), "dd/MM")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
