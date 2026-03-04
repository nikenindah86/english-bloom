import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { BookOpen, LogOut, Home, Users, FileText, ClipboardList, CheckSquare, CalendarCheck, GraduationCap, MoreHorizontal } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState } from "react";

const mainNavItems = [
  { label: "Home", icon: Home, path: "/admin" },
  { label: "Students", icon: Users, path: "/admin/students" },
  { label: "Classes", icon: GraduationCap, path: "/admin/classes" },
  { label: "Materials", icon: FileText, path: "/admin/materials" },
  { label: "Quizzes", icon: ClipboardList, path: "/admin/quizzes" },
];

const moreNavItems = [
  { label: "Grading", icon: CheckSquare, path: "/admin/grading" },
  { label: "Attendance", icon: CalendarCheck, path: "/admin/attendance" },
];

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="glass-strong sticky top-0 z-40 border-b border-border/50">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg leading-tight">Teacher Dashboard</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut} className="rounded-xl">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="container px-4 py-6">
        {children}
      </main>

      {/* Bottom Navigation */}
      <BottomNav location={location} navigate={navigate} />
    </div>
  );
};

const BottomNav = ({ location, navigate }: { location: ReturnType<typeof useLocation>; navigate: ReturnType<typeof useNavigate> }) => {
  const [moreOpen, setMoreOpen] = useState(false);
  const isMoreActive = moreNavItems.some((item) => location.pathname === item.path);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-strong border-t border-border/50">
      <div className="container flex items-center justify-around h-16 px-2">
        {mainNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-colors min-w-[56px] ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className={`w-4 h-4 ${isActive ? "text-primary" : ""}`} />
              <span className="text-[9px] font-semibold">{item.label}</span>
            </button>
          );
        })}
        <Popover open={moreOpen} onOpenChange={setMoreOpen}>
          <PopoverTrigger asChild>
            <button
              className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-colors min-w-[56px] ${
                isMoreActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MoreHorizontal className={`w-4 h-4 ${isMoreActive ? "text-primary" : ""}`} />
              <span className="text-[9px] font-semibold">More</span>
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" align="end" className="w-48 p-2 rounded-xl">
            {moreNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setMoreOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                    isActive ? "text-primary bg-accent" : "text-foreground hover:bg-accent"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
          </PopoverContent>
        </Popover>
      </div>
    </nav>
  );
};

export default AdminLayout;
