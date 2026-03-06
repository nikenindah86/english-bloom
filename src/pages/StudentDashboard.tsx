import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import StudentLayout from "@/components/student/StudentLayout";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Megaphone, ClipboardList, Sparkles, Trophy, Crown, Medal, FileText, Star, User, FileCheck, CalendarDays, PenTool } from "lucide-react";
import { format } from "date-fns";

type LeaderEntry = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  value: number;
};

const MEDAL_COLORS = [
  "text-yellow-500", // gold
  "text-gray-400",   // silver
  "text-rose-400",   // rose-gold
];

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [pendingQuizzes, setPendingQuizzes] = useState<any[]>([]);
  const [avgScore, setAvgScore] = useState<number | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [classId, setClassId] = useState<string | null>(null);
  const [scoreBoard, setScoreBoard] = useState<LeaderEntry[]>([]);
  const [attendBoard, setAttendBoard] = useState<LeaderEntry[]>([]);
  const [leaderLoading, setLeaderLoading] = useState(true);

  // Load dashboard basics
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [annRes, quizRes, subRes, profileRes] = await Promise.all([
        supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(3),
        supabase.from("quizzes").select("*").eq("is_active", true),
        supabase.from("quiz_submissions").select("quiz_id, score, status").eq("student_id", user.id),
        supabase.from("profiles").select("class_id").eq("id", user.id).single(),
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

      const cid = profileRes.data?.class_id || null;
      setClassId(cid);
      setLoading(false);
    };
    load();
  }, [user]);

  // Load leaderboards when classId is known
  useEffect(() => {
    if (!classId) {
      setLeaderLoading(false);
      return;
    }
    const loadLeaderboards = async () => {
      setLeaderLoading(true);

      // Get classmates
      const { data: classmates } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("class_id", classId);

      if (!classmates || classmates.length === 0) {
        setLeaderLoading(false);
        return;
      }

      const ids = classmates.map((c) => c.id);
      const profileMap = Object.fromEntries(classmates.map((c) => [c.id, c]));

      // Score leaderboard
      const { data: subs } = await supabase
        .from("quiz_submissions")
        .select("student_id, score")
        .in("student_id", ids)
        .eq("status", "graded");

      const scoreAgg: Record<string, { total: number; count: number }> = {};
      (subs || []).forEach((s) => {
        if (s.score === null) return;
        if (!scoreAgg[s.student_id]) scoreAgg[s.student_id] = { total: 0, count: 0 };
        scoreAgg[s.student_id].total += Number(s.score);
        scoreAgg[s.student_id].count += 1;
      });

      const scoreBoardData: LeaderEntry[] = Object.entries(scoreAgg)
        .map(([id, { total, count }]) => ({
          id,
          full_name: profileMap[id]?.full_name || "Student",
          avatar_url: profileMap[id]?.avatar_url || null,
          value: Math.round(total / count),
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
      setScoreBoard(scoreBoardData);

      // Attendance leaderboard
      const { data: att } = await supabase
        .from("attendance")
        .select("student_id, status")
        .in("student_id", ids)
        .eq("status", "present");

      const attAgg: Record<string, number> = {};
      (att || []).forEach((a) => {
        attAgg[a.student_id] = (attAgg[a.student_id] || 0) + 1;
      });

      const attendBoardData: LeaderEntry[] = Object.entries(attAgg)
        .map(([id, count]) => ({
          id,
          full_name: profileMap[id]?.full_name || "Student",
          avatar_url: profileMap[id]?.avatar_url || null,
          value: count,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
      setAttendBoard(attendBoardData);

      setLeaderLoading(false);
    };
    loadLeaderboards();
  }, [classId]);

  const getBadge = (score: number | null) => {
    if (score === null) return { emoji: "🌱", label: "Getting Started" };
    if (score >= 90) return { emoji: "🌟", label: "Superstar!" };
    if (score >= 70) return { emoji: "🌸", label: "Great Job!" };
    if (score >= 50) return { emoji: "🌻", label: "Keep Going!" };
    return { emoji: "🌱", label: "Growing!" };
  };

  const badge = getBadge(avgScore);

  const renderRankIcon = (index: number) => {
    if (index === 0) return <Crown className={`w-4 h-4 ${MEDAL_COLORS[0]}`} />;
    if (index === 1) return <Medal className={`w-4 h-4 ${MEDAL_COLORS[1]}`} />;
    if (index === 2) return <Medal className={`w-4 h-4 ${MEDAL_COLORS[2]}`} />;
    return <span className="text-xs font-bold text-muted-foreground w-4 text-center">{index + 1}</span>;
  };

  const renderAvatar = (entry: LeaderEntry) => {
    const initials = (entry.full_name || "?").charAt(0).toUpperCase();
    return (
      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 text-xs font-bold text-secondary-foreground">
        {entry.avatar_url ? (
          <img src={entry.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
        ) : (
          initials
        )}
      </div>
    );
  };

  const renderLeaderList = (entries: LeaderEntry[], unit: string) => {
    if (entries.length === 0) {
      return (
        <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
      );
    }
    return (
      <div className="space-y-1.5">
        {entries.map((entry, i) => (
          <div
            key={entry.id}
            className={`flex items-center gap-2.5 p-2.5 rounded-xl transition-all ${
              entry.id === user?.id
                ? "bg-accent/50 ring-1 ring-primary/20"
                : "hover:bg-muted/30"
            }`}
          >
            {renderRankIcon(i)}
            {renderAvatar(entry)}
            <span className="text-sm font-medium truncate flex-1">{entry.full_name}</span>
            <span className="text-xs font-bold text-primary shrink-0">
              {entry.value}{unit}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <StudentLayout>
      <div className="space-y-6">
      {/* Welcome */}
        <div>
          <h2 className="font-display font-bold text-2xl">Hello! 🌸</h2>
          <p className="text-muted-foreground mt-1">Ready to learn something new today?</p>
        </div>

        {/* Mobile Icon Grid Menu */}
        <div className="md:hidden">
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Materials", icon: FileText, path: "/student/materials", bg: "bg-accent" },
              { label: "Quizzes", icon: ClipboardList, path: "/student/quizzes", bg: "bg-secondary" },
              { label: "Tests", icon: PenTool, path: "/student/assessments", bg: "bg-lavender" },
              { label: "Assignments", icon: FileCheck, path: "/student/assignments", bg: "bg-blush" },
              { label: "Schedule", icon: CalendarDays, path: "/student/schedule", bg: "bg-lavender" },
              { label: "Grades", icon: Star, path: "/student/grades", bg: "bg-accent" },
              { label: "Profile", icon: User, path: "/student/profile", bg: "bg-secondary" },
              { label: "Notifications", icon: Megaphone, path: "/student", bg: "bg-blush" },
            ].map((item) => (
              <button
                key={item.path + item.label}
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

        {/* Class Leaderboard */}
        <div className="space-y-3">
          <h3 className="font-display font-bold text-base flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" /> Class Leaderboard
          </h3>
          {!classId ? (
            <div className="glass rounded-2xl p-6 text-center space-y-2">
              <p className="text-sm text-muted-foreground">Join a class to see the leaderboard!</p>
              <button
                onClick={() => navigate("/student/profile")}
                className="text-xs font-bold text-primary underline"
              >
                Select your class →
              </button>
            </div>
          ) : leaderLoading ? (
            <div className="glass rounded-2xl p-6 text-center">
              <p className="text-sm text-muted-foreground animate-pulse">Loading leaderboard...</p>
            </div>
          ) : (
            <div className="glass rounded-2xl p-4">
              <Tabs defaultValue="scores">
                <TabsList className="w-full rounded-xl bg-muted/50">
                  <TabsTrigger value="scores" className="flex-1 rounded-lg text-xs font-bold">
                    ⭐ Top Scores
                  </TabsTrigger>
                  <TabsTrigger value="attendance" className="flex-1 rounded-lg text-xs font-bold">
                    📅 Top Attendance
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="scores" className="mt-3">
                  {renderLeaderList(scoreBoard, "%")}
                </TabsContent>
                <TabsContent value="attendance" className="mt-3">
                  {renderLeaderList(attendBoard, " days")}
                </TabsContent>
              </Tabs>
            </div>
          )}
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
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                    <ClipboardList className="w-5 h-5 text-secondary-foreground" />
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
