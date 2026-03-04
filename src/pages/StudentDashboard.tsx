import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import StudentLayout from "@/components/student/StudentLayout";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Megaphone, ClipboardList, Sparkles } from "lucide-react";
import { format } from "date-fns";

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [pendingQuizzes, setPendingQuizzes] = useState<any[]>([]);
  const [avgScore, setAvgScore] = useState<number | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [annRes, quizRes, subRes] = await Promise.all([
        supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(3),
        supabase.from("quizzes").select("*").eq("is_active", true),
        supabase.from("quiz_submissions").select("quiz_id, score, status").eq("student_id", user.id),
      ]);

      setAnnouncements(annRes.data || []);

      const submittedIds = new Set((subRes.data || []).map((s) => s.quiz_id));
      setPendingQuizzes((quizRes.data || []).filter((q) => !submittedIds.has(q.id)));

      const graded = (subRes.data || []).filter((s) => s.status === "graded" && s.score !== null);
      setCompletedCount(graded.length);
      if (graded.length > 0) {
        const avg = graded.reduce((sum, s) => sum + Number(s.score), 0) / graded.length;
        setAvgScore(Math.round(avg));
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const getBadge = (score: number | null) => {
    if (score === null) return { emoji: "🌱", label: "Getting Started" };
    if (score >= 90) return { emoji: "🌟", label: "Superstar!" };
    if (score >= 70) return { emoji: "🌸", label: "Great Job!" };
    if (score >= 50) return { emoji: "🌻", label: "Keep Going!" };
    return { emoji: "🌱", label: "Growing!" };
  };

  const badge = getBadge(avgScore);

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Welcome */}
        <div>
          <h2 className="font-display font-bold text-2xl">Hello! 🌸</h2>
          <p className="text-muted-foreground mt-1">Ready to learn something new today?</p>
        </div>

        {/* Progress Card */}
        <div className="glass rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="font-display font-bold text-sm">My Progress</span>
            </div>
            <span className="text-3xl">{badge.emoji}</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{badge.label}</span>
              <span className="font-bold text-primary">{avgScore !== null ? `${avgScore}%` : "—"}</span>
            </div>
            <Progress value={avgScore ?? 0} className="h-3 rounded-full" />
          </div>
          <p className="text-xs text-muted-foreground">{completedCount} quiz{completedCount !== 1 ? "zes" : ""} graded</p>
        </div>

        {/* Pending Quizzes */}
        {pendingQuizzes.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-display font-bold text-base flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary" /> To-Do
            </h3>
            <div className="space-y-2">
              {pendingQuizzes.map((q) => (
                <button
                  key={q.id}
                  onClick={() => navigate(`/student/quiz/${q.id}`)}
                  className="glass rounded-2xl p-4 w-full text-left flex items-center gap-3 hover:shadow-lg transition-shadow"
                >
                  <div className="w-10 h-10 rounded-xl bg-lavender flex items-center justify-center shrink-0">
                    <ClipboardList className="w-5 h-5 text-plum" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-display font-bold text-sm truncate">{q.title}</p>
                    {q.description && (
                      <p className="text-xs text-muted-foreground truncate">{q.description}</p>
                    )}
                  </div>
                  <span className="ml-auto text-xs font-bold text-primary shrink-0">Start →</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Announcements */}
        <div className="space-y-3">
          <h3 className="font-display font-bold text-base flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-primary" /> Announcements
          </h3>
          {announcements.length === 0 && !loading ? (
            <div className="glass rounded-2xl p-6 text-center">
              <p className="text-sm text-muted-foreground">No announcements yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {announcements.map((a) => (
                <div key={a.id} className="glass rounded-2xl p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-display font-bold text-sm">{a.title}</p>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(a.created_at), "MMM d")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{a.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentDashboard;
