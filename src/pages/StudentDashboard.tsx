import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { BookOpen, LogOut, Megaphone, FileText, ClipboardList, Star } from "lucide-react";

const StudentDashboard = () => {
  const { user, signOut } = useAuth();

  const cards = [
    { label: "Announcements", icon: Megaphone, description: "Latest updates from your teacher", color: "bg-accent text-accent-foreground" },
    { label: "Materials", icon: FileText, description: "Worksheets & tutorials", color: "bg-secondary text-secondary-foreground" },
    { label: "Quizzes", icon: ClipboardList, description: "Test your knowledge", color: "bg-lavender text-plum" },
    { label: "My Progress", icon: Star, description: "Track your scores", color: "bg-blush text-primary" },
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
              <h1 className="font-display font-bold text-lg leading-tight">Student Portal</h1>
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
          <h2 className="font-display font-bold text-2xl">Hello! 🌸</h2>
          <p className="text-muted-foreground mt-1">Ready to learn something new today?</p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cards.map((card) => (
            <div key={card.label} className="glass rounded-2xl p-5 flex items-start gap-4 cursor-pointer hover:shadow-lg transition-shadow">
              <div className={`w-12 h-12 rounded-xl ${card.color} flex items-center justify-center shrink-0`}>
                <card.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="font-display font-bold text-base">{card.label}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{card.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="glass rounded-2xl p-6 text-center space-y-2">
          <BookOpen className="w-10 h-10 mx-auto text-muted-foreground/40" />
          <p className="text-muted-foreground font-medium">Full student features coming in Phase 2</p>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
