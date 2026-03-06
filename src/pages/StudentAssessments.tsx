import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import StudentLayout from "@/components/student/StudentLayout";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileCheck, Clock, Loader2 } from "lucide-react";

type AssessmentItem = {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  question_count: number;
  status: "not_started" | "in_progress" | "submitted";
  score?: number | null;
};

const StudentAssessments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<AssessmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: assessments } = await supabase
        .from("assessments")
        .select("id, title, description, duration_minutes")
        .eq("is_active", true);

      if (!assessments || assessments.length === 0) { setLoading(false); return; }

      const ids = assessments.map((a) => a.id);
      const [{ data: questions }, { data: subs }] = await Promise.all([
        supabase.from("assessment_questions").select("assessment_id").in("assessment_id", ids),
        supabase.from("assessment_submissions").select("assessment_id, status, score").eq("student_id", user.id),
      ]);

      const qCountMap: Record<string, number> = {};
      questions?.forEach((q) => { qCountMap[q.assessment_id] = (qCountMap[q.assessment_id] || 0) + 1; });

      const subMap: Record<string, { status: string; score: number | null }> = {};
      subs?.forEach((s) => { subMap[s.assessment_id] = { status: s.status, score: s.score }; });

      setItems(assessments.map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        duration_minutes: a.duration_minutes,
        question_count: qCountMap[a.id] || 0,
        status: subMap[a.id]?.status === "submitted" || subMap[a.id]?.status === "graded"
          ? "submitted"
          : subMap[a.id]?.status === "in_progress"
            ? "in_progress"
            : "not_started",
        score: subMap[a.id]?.score,
      })));
      setLoading(false);
    };
    load();
  }, [user]);

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h2 className="font-display font-bold text-2xl">Assessments</h2>
          <p className="text-muted-foreground mt-1">Take your tests here</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : items.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center space-y-2">
            <FileCheck className="w-10 h-10 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">No assessments available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="glass rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold truncate">{item.title}</h3>
                      <Badge variant={item.status === "submitted" ? "default" : item.status === "in_progress" ? "secondary" : "outline"} className="text-[10px]">
                        {item.status === "submitted" ? (item.score !== null ? `Score: ${item.score}` : "Submitted") : item.status === "in_progress" ? "In Progress" : "Not Started"}
                      </Badge>
                    </div>
                    {item.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {item.duration_minutes} min</span>
                    <span>{item.question_count} questions</span>
                  </div>
                  {item.status !== "submitted" && (
                    <Button size="sm" className="rounded-xl text-xs" onClick={() => navigate(`/student/assessment/${item.id}`)}>
                      {item.status === "in_progress" ? "Continue" : "Start Test"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentAssessments;
