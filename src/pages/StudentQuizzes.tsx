import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import StudentLayout from "@/components/student/StudentLayout";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, CheckCircle } from "lucide-react";

const StudentQuizzes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [submittedIds, setSubmittedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [qRes, sRes] = await Promise.all([
        supabase.from("quizzes").select("*").eq("is_active", true).order("created_at", { ascending: false }),
        supabase.from("quiz_submissions").select("quiz_id").eq("student_id", user.id),
      ]);
      setQuizzes(qRes.data || []);
      setSubmittedIds(new Set((sRes.data || []).map((s) => s.quiz_id)));
      setLoading(false);
    };
    load();
  }, [user]);

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h2 className="font-display font-bold text-2xl">Quizzes 📋</h2>
          <p className="text-muted-foreground mt-1">Complete your assigned quizzes</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass rounded-2xl p-5 h-20 animate-pulse" />
            ))}
          </div>
        ) : quizzes.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <ClipboardList className="w-10 h-10 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium mt-2">No quizzes available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {quizzes.map((q) => {
              const done = submittedIds.has(q.id);
              return (
                <button
                  key={q.id}
                  onClick={() => navigate(`/student/quiz/${q.id}`)}
                  className="glass rounded-2xl p-4 w-full text-left flex items-center gap-3 hover:shadow-lg transition-shadow"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${done ? "bg-secondary" : "bg-lavender"}`}>
                    {done ? (
                      <CheckCircle className="w-5 h-5 text-secondary-foreground" />
                    ) : (
                      <ClipboardList className="w-5 h-5 text-plum" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display font-bold text-sm truncate">{q.title}</p>
                    {q.description && (
                      <p className="text-xs text-muted-foreground truncate">{q.description}</p>
                    )}
                  </div>
                  <Badge variant={done ? "secondary" : "default"} className="text-[10px] shrink-0">
                    {done ? "Done" : "Start"}
                  </Badge>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentQuizzes;
