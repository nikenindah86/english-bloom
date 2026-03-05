import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal } from "lucide-react";

type LeaderboardEntry = {
  student_id: string;
  score: number;
  full_name: string;
  avatar_url: string | null;
};

const rankColors = ["text-yellow-500", "text-gray-400", "text-amber-600"];

const QuizLeaderboard = ({ quizId }: { quizId: string }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: subs } = await supabase
        .from("quiz_submissions")
        .select("student_id, score")
        .eq("quiz_id", quizId)
        .not("score", "is", null)
        .order("score", { ascending: false });

      if (!subs || subs.length === 0) {
        setLoading(false);
        return;
      }

      const studentIds = [...new Set(subs.map((s) => s.student_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", studentIds);

      const profileMap: Record<string, { full_name: string; avatar_url: string | null }> = {};
      profiles?.forEach((p) => {
        profileMap[p.id] = { full_name: p.full_name || "Student", avatar_url: p.avatar_url };
      });

      const mapped: LeaderboardEntry[] = subs.map((s) => ({
        student_id: s.student_id,
        score: s.score || 0,
        full_name: profileMap[s.student_id]?.full_name || "Student",
        avatar_url: profileMap[s.student_id]?.avatar_url || null,
      }));

      setEntries(mapped.slice(0, 10));
      setLoading(false);
    };
    load();
  }, [quizId]);

  if (loading) return null;
  if (entries.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Trophy className="w-5 h-5 text-yellow-500" />
        <h3 className="font-display font-bold text-sm">Leaderboard</h3>
      </div>
      <div className="space-y-2">
        {entries.map((entry, idx) => (
          <div
            key={entry.student_id}
            className="flex items-center gap-3 rounded-xl bg-muted/40 p-3"
          >
            <span className={`font-bold text-lg w-6 text-center ${idx < 3 ? rankColors[idx] : "text-muted-foreground"}`}>
              {idx < 3 ? <Medal className="w-5 h-5 inline" /> : idx + 1}
            </span>
            <Avatar className="w-8 h-8">
              <AvatarImage src={entry.avatar_url || undefined} />
              <AvatarFallback className="text-xs">{entry.full_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="flex-1 text-sm font-medium truncate">{entry.full_name}</span>
            <span className="font-bold text-sm text-primary">{entry.score} pts</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuizLeaderboard;
