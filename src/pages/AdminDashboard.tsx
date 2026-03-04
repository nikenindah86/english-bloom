import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { BookOpen, LogOut, Megaphone, FileText, ClipboardList, Users } from "lucide-react";

const AdminDashboard = () => {
  const { user, signOut } = useAuth();

  const stats = [
    { label: "Announcements", icon: Megaphone, count: 0, color: "bg-accent text-accent-foreground" },
    { label: "Materials", icon: FileText, count: 0, color: "bg-secondary text-secondary-foreground" },
    { label: "Quizzes", icon: ClipboardList, count: 0, color: "bg-lavender text-plum" },
    { label: "Students", icon: Users, count: 0, color: "bg-blush text-primary" },
  ];

  return (
    <div className="min-h-screen bg-background">
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
      <main className="container px-4 py-6 space-y-6">
        <div>
          <h2 className="font-display font-bold text-2xl">Welcome back! 👋</h2>
          <p className="text-muted-foreground mt-1">Here's your classroom overview</p>
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

        {/* Placeholder sections */}
        <div className="glass rounded-2xl p-6 text-center space-y-2">
          <Megaphone className="w-10 h-10 mx-auto text-muted-foreground/40" />
          <p className="text-muted-foreground font-medium">Announcements, materials, and quizzes management coming in Phase 2</p>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
