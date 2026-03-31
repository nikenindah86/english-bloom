import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Home, FileText, ClipboardList, Star, User, Users, CheckSquare, MoreHorizontal, BookOpen } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { GraduationCap, PenLine, CalendarCheck, FileCheck, CalendarDays, StickyNote, Megaphone, NotebookPen, ShoppingBag, ClipboardPenLine } from "lucide-react";
import { useState } from "react";

type NavItem = {
  label: string;
  icon: React.ElementType;
  path: string;
};

const studentNav: NavItem[] = [
  { label: "Home", icon: Home, path: "/student" },
  { label: "Courses", icon: BookOpen, path: "/student/courses" },
  { label: "Quizzes", icon: ClipboardList, path: "/student/quizzes" },
  { label: "Grades", icon: Star, path: "/student/grades" },
  { label: "Profile", icon: User, path: "/student/profile" },
];

const adminMainNav: NavItem[] = [
  { label: "Home", icon: Home, path: "/admin" },
  { label: "Students", icon: Users, path: "/admin/students" },
  { label: "Quizzes", icon: ClipboardList, path: "/admin/quizzes" },
  { label: "Grading", icon: CheckSquare, path: "/admin/grading" },
];

const adminMoreItems: NavItem[] = [
  { label: "Announce", icon: Megaphone, path: "/admin/announcements" },
  { label: "Courses", icon: BookOpen, path: "/admin/courses" },
  { label: "Assessments", icon: FileCheck, path: "/admin/assessments" },
  { label: "Classes", icon: GraduationCap, path: "/admin/classes" },
  { label: "Materials", icon: FileText, path: "/admin/materials" },
  { label: "Assignments", icon: ClipboardPenLine, path: "/admin/assignments" },
  { label: "Schedule", icon: CalendarDays, path: "/admin/schedule" },
  { label: "Manual Grades", icon: PenLine, path: "/admin/manual-grades" },
  { label: "Attendance", icon: CalendarCheck, path: "/admin/attendance" },
  { label: "Student Notes", icon: StickyNote, path: "/admin/student-notes" },
  { label: "Lesson Plans", icon: NotebookPen, path: "/admin/lesson-plans" },
  { label: "Products", icon: ShoppingBag, path: "/admin/products" },
];

const MobileBottomNav = ({ role }: { role: "student" | "admin" }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  const mainItems = role === "student" ? studentNav : adminMainNav;

  const isActive = (path: string) => {
    if (path === "/student" || path === "/admin") return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const moreActive = role === "admin" && adminMoreItems.some((item) => isActive(item.path));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass-strong border-t border-border/50">
      <div className="flex items-center justify-around h-16 px-1 pb-safe">
        {mainItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-colors min-w-0 flex-1",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5", active && "drop-shadow-sm")} />
              <span className="text-[10px] font-bold truncate">{item.label}</span>
            </button>
          );
        })}

        {role === "admin" && (
          <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-colors min-w-0 flex-1",
                  moreActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <MoreHorizontal className="w-5 h-5" />
                <span className="text-[10px] font-bold">More</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl pb-8">
              <SheetHeader>
                <SheetTitle className="font-display text-base">More Menu</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-3 gap-3 mt-4">
                {adminMoreItems.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        setMoreOpen(false);
                        navigate(item.path);
                      }}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all",
                        active ? "bg-accent text-primary" : "hover:bg-muted/50 text-muted-foreground"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="text-[11px] font-bold">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
