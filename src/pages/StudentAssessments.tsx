import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import StudentLayout from "@/components/student/StudentLayout";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileCheck, Clock, Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react";

const ITEMS_PER_PAGE = 10;

type AssessmentItem = {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  question_count: number;
  status: "not_started" | "in_progress" | "submitted";
  score?: number | null;
  purpose?: string | null;
  scheduled_at?: string | null;
  expires_at?: string | null;
  created_at?: string;
};

const StudentAssessments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<AssessmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: profile } = await supabase.from("profiles").select("class_id").eq("id", user.id).single();

      let classAssessmentIds: string[] = [];
      if (profile?.class_id) {
        const { data: classAssigns } = await supabase.from("assessment_class_assignments").select("assessment_id").eq("class_id", profile.class_id);
        classAssessmentIds = (classAssigns || []).map(ca => ca.assessment_id);
      }

      const { data: studentAssigns } = await supabase.from("assessment_student_assignments").select("assessment_id, purpose").eq("student_id", user.id);
      const studentAssignMap: Record<string, string> = {};
      (studentAssigns || []).forEach(sa => { studentAssignMap[sa.assessment_id] = sa.purpose; });
      const studentAssessmentIds = Object.keys(studentAssignMap);

      let legacyIds: string[] = [];
      if (profile?.class_id) {
        const { data: legacyAssessments } = await supabase.from("assessments").select("id").eq("class_id", profile.class_id).eq("is_active", true);
        legacyIds = (legacyAssessments || []).map(a => a.id);
      }

      const allIds = [...new Set([...classAssessmentIds, ...studentAssessmentIds, ...legacyIds])];
      if (allIds.length === 0) { setLoading(false); return; }

      const { data: assessments } = await supabase.from("assessments").select("id, title, description, duration_minutes, scheduled_at, expires_at, created_at").eq("is_active", true).in("id", allIds);
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

      setItems(assessments.map((a: any) => ({
        id: a.id, title: a.title, description: a.description, duration_minutes: a.duration_minutes,
        question_count: qCountMap[a.id] || 0,
        status: subMap[a.id]?.status === "submitted" || subMap[a.id]?.status === "graded" ? "submitted" : subMap[a.id]?.status === "in_progress" ? "in_progress" : "not_started",
        score: subMap[a.id]?.score, purpose: studentAssignMap[a.id] || null,
        scheduled_at: a.scheduled_at, expires_at: a.expires_at, created_at: a.created_at,
      })));
      setLoading(false);
    };
    load();
  }, [user]);

  const getDisplayStatus = (item: AssessmentItem) => {
    const now = new Date();
    if (item.status === "submitted") return "submitted";
    if (item.expires_at && new Date(item.expires_at) < now) return "expired";
    if (item.scheduled_at && new Date(item.scheduled_at) > now) return "upcoming";
    if (item.status === "in_progress") return "in_progress";
    return "not_started";
  };

  const filtered = useMemo(() => {
    let result = items.filter((item) => {
      const matchSearch = !search || item.title?.toLowerCase().includes(search.toLowerCase()) || item.description?.toLowerCase().includes(search.toLowerCase());
      const status = getDisplayStatus(item);
      const matchFilter = filterStatus === "all" || status === filterStatus;
      return matchSearch && matchFilter;
    });
    result.sort((a, b) => {
      if (sortBy === "newest") return new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime();
      if (sortBy === "oldest") return new Date(a.created_at || "").getTime() - new Date(b.created_at || "").getTime();
      if (sortBy === "status") {
        const order = { not_started: 0, in_progress: 1, submitted: 2, expired: 3, upcoming: 4 };
        return (order[getDisplayStatus(a) as keyof typeof order] || 0) - (order[getDisplayStatus(b) as keyof typeof order] || 0);
      }
      return 0;
    });
    return result;
  }, [items, search, sortBy, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  useEffect(() => { setPage(1); }, [search, sortBy, filterStatus]);

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h2 className="font-display font-bold text-2xl">Assessments</h2>
          <p className="text-muted-foreground mt-1">Take your tests here</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search assessments..." className="pl-9 rounded-xl text-sm" />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-36 rounded-xl text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-36 rounded-xl text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="not_started">Not Started</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : paginated.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center space-y-2">
            <FileCheck className="w-10 h-10 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">{search || filterStatus !== "all" ? "No assessments match your filter" : "No assessments available"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {paginated.map((item) => {
              const displayStatus = getDisplayStatus(item);
              return (
                <div key={item.id} className={`glass rounded-2xl p-4 space-y-3 ${displayStatus === "expired" ? "opacity-60" : ""}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold truncate">{item.title}</h3>
                        <Badge variant={item.status === "submitted" ? "default" : item.status === "in_progress" ? "secondary" : "outline"} className="text-[10px]">
                          {item.status === "submitted" ? (item.score !== null ? `Score: ${item.score}` : "Submitted") : item.status === "in_progress" ? "In Progress" : "Not Started"}
                        </Badge>
                        {item.purpose && <Badge variant="secondary" className="text-[10px] capitalize">{item.purpose}</Badge>}
                        {displayStatus === "expired" && <Badge variant="destructive" className="text-[10px]">⏰ Expired</Badge>}
                        {displayStatus === "upcoming" && <Badge variant="outline" className="text-[10px]">🔒 Opens {new Date(item.scheduled_at!).toLocaleString()}</Badge>}
                      </div>
                      {item.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {item.duration_minutes} min</span>
                      <span>{item.question_count} questions</span>
                    </div>
                    {item.status !== "submitted" && displayStatus !== "expired" && displayStatus !== "upcoming" && (
                      <Button size="sm" className="rounded-xl text-xs" onClick={() => navigate(`/student/assessment/${item.id}`)}>
                        {item.status === "in_progress" ? "Continue" : "Start Test"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </Button>
            <span className="text-xs text-muted-foreground">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              Next <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentAssessments;
