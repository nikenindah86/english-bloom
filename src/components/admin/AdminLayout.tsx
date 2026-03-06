import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import NotificationBell from "@/components/NotificationBell";
import MobileBottomNav from "@/components/MobileBottomNav";
import {
  BookOpen, LogOut, Home, Users, FileText, ClipboardList,
  CheckSquare, CalendarCheck, GraduationCap, PenLine, FileCheck, CalendarDays, StickyNote, NotebookPen,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarProvider, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Dashboard", url: "/admin", icon: Home },
];

const academicItems = [
  { title: "Classes", url: "/admin/classes", icon: GraduationCap },
  { title: "Students", url: "/admin/students", icon: Users },
  { title: "Materials", url: "/admin/materials", icon: FileText },
  { title: "Quizzes", url: "/admin/quizzes", icon: ClipboardList },
  { title: "Assessments", url: "/admin/assessments", icon: FileCheck },
  { title: "Assignments", url: "/admin/assignments", icon: FileCheck },
  { title: "Lesson Plans", url: "/admin/lesson-plans", icon: NotebookPen },
  { title: "Schedule", url: "/admin/schedule", icon: CalendarDays },
];

const assessmentItems = [
  { title: "Grading", url: "/admin/grading", icon: CheckSquare },
  { title: "Manual Grades", url: "/admin/manual-grades", icon: PenLine },
  { title: "Attendance", url: "/admin/attendance", icon: CalendarCheck },
  { title: "Student Notes", url: "/admin/student-notes", icon: StickyNote },
];

const AdminSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const renderGroup = (label: string, items: typeof mainItems) => (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  end={item.url === "/admin"}
                  className="hover:bg-sidebar-accent/50"
                  activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" className="hidden md:flex">
      <SidebarContent className="pt-4">
        <div className="px-4 pb-2 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4 text-primary" />
          </div>
          {!collapsed && (
            <span className="font-display font-bold text-sm truncate">Teacher Panel</span>
          )}
        </div>
        {renderGroup("Main", mainItems)}
        {renderGroup("Academic", academicItems)}
        {renderGroup("Assessment", assessmentItems)}
      </SidebarContent>
    </Sidebar>
  );
};

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, signOut } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="glass-strong sticky top-0 z-40 border-b border-border/50">
            <div className="flex items-center justify-between h-14 px-4">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="hidden md:flex" />
                <div className="flex md:hidden items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="font-display font-bold text-sm">Teacher</span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <NotificationBell />
                <Button variant="ghost" size="icon" onClick={signOut} className="rounded-xl">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </header>
          <main className="flex-1 px-4 py-6 pb-24 md:pb-6 max-w-5xl mx-auto w-full">
            {children}
          </main>
        </div>
        <MobileBottomNav role="admin" />
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
