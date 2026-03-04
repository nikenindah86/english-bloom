import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import StudentLayout from "@/components/student/StudentLayout";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Star, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";

const StudentGrades = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: subs } = await supabase
        .from("quiz_submissions")
        .select("*")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });

      if (!subs || subs.length === 0) {
        setLoading(false);
        return;
      }

      const quizIds = [...new Set(subs.map((s) => s.quiz_id))];
      const { data: quizzes } = await supabase.from("quizzes").select("id, title").in("id", quizIds);
      const quizMap = Object.fromEntries((quizzes || []).map((q) => [q.id, q.title]));

      setSubmissions(subs.map((s) => ({ ...s, quiz_title: quizMap[s.quiz_id] || "Unknown Quiz" })));
      setLoading(false);
    };
    load();
  }, [user]);

  const graded = submissions.filter((s) => s.status === "graded" && s.score !== null);
  const avgScore = graded.length > 0 ? Math.round(graded.reduce((sum, s) => sum + Number(s.score), 0) / graded.length) : null;

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h2 className="font-display font-bold text-2xl">My Grades 📝</h2>
          <p className="text-muted-foreground mt-1">Your quiz results & teacher feedback</p>
        </div>

        {/* Overall Score */}
        <div className="glass rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" />
            <span className="font-display font-bold text-sm">Overall Average</span>
          </div>
          <div className="flex items-end gap-3">
            <span className="font-display font-bold text-4xl text-primary">
              {avgScore !== null ? `${avgScore}%` : "—"}
            </span>
            <span className="text-xs text-muted-foreground mb-1">
              from {graded.length} graded quiz{graded.length !== 1 ? "zes" : ""}
            </span>
          </div>
          <Progress value={avgScore ?? 0} className="h-3 rounded-full" />
        </div>

        {/* Submissions */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="glass rounded-2xl p-5 h-20 animate-pulse" />
            ))}
          </div>
        ) : submissions.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-muted-foreground">No quiz submissions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((s) => {
              const isExpanded = expandedId === s.id;
              return (
                <div key={s.id} className="glass rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : s.id)}
                    className="w-full p-4 flex items-center gap-3 text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-lavender flex items-center justify-center shrink-0">
                      <span className="font-display font-bold text-sm text-plum">
                        {s.score !== null ? s.score : "?"}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-display font-bold text-sm truncate">{s.quiz_title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge
                          variant={s.status === "graded" ? "default" : "secondary"}
                          className="text-[10px] px-2 py-0"
                        >
                          {s.status === "graded" ? "Graded" : "Pending"}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(s.created_at), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                  </button>

                  {isExpanded && s.feedback && (
                    <div className="px-4 pb-4 border-t border-border/50">
                      <div className="mt-3 p-3 rounded-xl bg-accent/50 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-accent-foreground">
                          <MessageCircle className="w-3.5 h-3.5" />
                          Teacher Feedback
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{s.feedback}</p>
                      </div>
                    </div>
                  )}

                  {isExpanded && !s.feedback && (
                    <div className="px-4 pb-4 border-t border-border/50">
                      <p className="text-xs text-muted-foreground mt-3">No feedback yet</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentGrades;
