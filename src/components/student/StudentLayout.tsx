import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import NotificationBell from "@/components/NotificationBell";
import MobileBottomNav from "@/components/MobileBottomNav";
import { BookOpen, LogOut, Home, FileText, ClipboardList, Star, User, FileCheck, CalendarDays, PenTool } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarProvider, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { label: "Home", icon: Home, path: "/student" },
  { label: "Materials", icon: FileText, path: "/student/materials" },
  { label: "Quizzes", icon: ClipboardList, path: "/student/quizzes" },
  { label: "Tests", icon: PenTool, path: "/student/assessments" },
  { label: "Assignments", icon: FileCheck, path: "/student/assignments" },
  { label: "Schedule", icon: CalendarDays, path: "/student/schedule" },
  { label: "Grades", icon: Star, path: "/student/grades" },
  { label: "Profile", icon: User, path: "/student/profile" },
];

const StudentSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="hidden md:flex">
      <SidebarContent className="pt-4">
        <div className="px-4 pb-2 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4 text-primary" />
          </div>
          {!collapsed && (
            <span className="font-display font-bold text-sm truncate">Student Portal</span>
          )}
        </div>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.path}
                      end={item.path === "/student"}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

const StudentLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, signOut } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <StudentSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="glass-strong sticky top-0 z-40 border-b border-border/50">
            <div className="flex items-center justify-between h-14 px-4">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="hidden md:flex" />
                <div className="flex md:hidden items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
                    <BookOpen className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="font-display font-bold text-sm">Student</span>
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
          <main className="flex-1 px-4 py-6 pb-24 md:pb-6 max-w-4xl mx-auto w-full">
            {children}
          </main>
        </div>
        <MobileBottomNav role="student" />
      </div>
    </SidebarProvider>
  );
};

export default StudentLayout;
