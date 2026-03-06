import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import AnnouncementSection from "@/components/admin/AnnouncementSection";
import { Users, ClipboardList, FileText, Megaphone, GraduationCap, FileCheck, CalendarDays, CheckSquare, PenLine, CalendarCheck, StickyNote, NotebookPen } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

  const stats = [
    { label: "Students", icon: Users, count: studentCount, color: "bg-blush text-primary" },
    { label: "Pending", icon: ClipboardList, count: pendingCount, color: "bg-lavender text-plum" },
    { label: "Announcements", icon: Megaphone, count: announcementCount, color: "bg-accent text-accent-foreground" },
    { label: "Materials", icon: FileText, count: materialCount, color: "bg-secondary text-secondary-foreground" },
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
              { label: "Lessons", icon: NotebookPen, path: "/admin/lesson-plans", bg: "bg-blush" },
              { label: "Schedule", icon: CalendarDays, path: "/admin/schedule", bg: "bg-secondary" },
              { label: "Grading", icon: CheckSquare, path: "/admin/grading", bg: "bg-blush" },
              { label: "Manual", icon: PenLine, path: "/admin/manual-grades", bg: "bg-lavender" },
              { label: "Attendance", icon: CalendarCheck, path: "/admin/attendance", bg: "bg-accent" },
              { label: "Notes", icon: StickyNote, path: "/admin/student-notes", bg: "bg-secondary" },
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

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="glass rounded-2xl p-5 space-y-3">
              <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">{stat.count}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Announcements */}
        <AnnouncementSection />
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
