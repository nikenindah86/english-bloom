import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import StudentLayout from "@/components/student/StudentLayout";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ClipboardList, CheckCircle, Clock, Trophy, Search, ChevronLeft, ChevronRight } from "lucide-react";

const ITEMS_PER_PAGE = 10;

const StudentQuizzes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [submittedIds, setSubmittedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: profile } = await supabase.from("profiles").select("class_id").eq("id", user.id).single();
      const classId = profile?.class_id;

      let quizQuery = supabase.from("quizzes").select("*").eq("is_active", true).order("created_at", { ascending: false });
      if (classId) {
        quizQuery = quizQuery.or(`class_id.eq.${classId},class_id.is.null`);
      } else {
        quizQuery = quizQuery.is("class_id", null);
      }

      const [qRes, sRes] = await Promise.all([
        quizQuery,
        supabase.from("quiz_submissions").select("quiz_id").eq("student_id", user.id),
      ]);
      setQuizzes(qRes.data || []);
      setSubmittedIds(new Set((sRes.data || []).map((s) => s.quiz_id)));
      setLoading(false);
    };
    load();
  }, [user]);

  const getStatus = (q: any) => {
    if (submittedIds.has(q.id)) return "done";
    const now = new Date();
    if (q.scheduled_at && new Date(q.scheduled_at) > now) return "upcoming";
    if (q.expires_at && new Date(q.expires_at) < now) return "expired";
    return "pending";
  };

  const filtered = useMemo(() => {
    let result = quizzes.filter((q) => {
      const matchSearch = !search || q.title?.toLowerCase().includes(search.toLowerCase()) || q.description?.toLowerCase().includes(search.toLowerCase());
      const status = getStatus(q);
      const matchFilter = filterStatus === "all" || status === filterStatus;
      return matchSearch && matchFilter;
    });

    result.sort((a, b) => {
      if (sortBy === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === "status") {
        const order = { pending: 0, upcoming: 1, done: 2, expired: 3 };
        return (order[getStatus(a) as keyof typeof order] || 0) - (order[getStatus(b) as keyof typeof order] || 0);
      }
      return 0;
    });

    return result;
  }, [quizzes, search, sortBy, filterStatus, submittedIds]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  useEffect(() => { setPage(1); }, [search, sortBy, filterStatus]);

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h2 className="font-display font-bold text-2xl">Quizzes 📋</h2>
          <p className="text-muted-foreground mt-1">Complete your assigned quizzes</p>
        </div>

        {/* Search, Sort, Filter */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search quizzes..." className="pl-9 rounded-xl text-sm" />
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
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="done">Done</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => (<div key={i} className="glass rounded-2xl p-5 h-20 animate-pulse" />))}</div>
        ) : paginated.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <ClipboardList className="w-10 h-10 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium mt-2">{search || filterStatus !== "all" ? "No quizzes match your filter" : "No quizzes available"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {paginated.map((q) => {
              const status = getStatus(q);
              const isDisabled = status === "upcoming" || status === "expired";
              return (
                <button key={q.id} onClick={() => !isDisabled && navigate(`/student/quiz/${q.id}`)} disabled={isDisabled} className={`glass rounded-2xl p-4 w-full text-left flex items-center gap-3 transition-shadow ${isDisabled ? "opacity-60 cursor-not-allowed" : "hover:shadow-lg"}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${status === "done" ? "bg-secondary" : status === "expired" ? "bg-destructive/10" : "bg-lavender"}`}>
                    {status === "done" ? <CheckCircle className="w-5 h-5 text-secondary-foreground" /> : <ClipboardList className="w-5 h-5 text-plum" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display font-bold text-sm truncate">{q.title}</p>
                    {q.description && <p className="text-xs text-muted-foreground truncate">{q.description}</p>}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {q.time_limit && <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"><Clock className="w-3 h-3" /> {q.time_limit}s</span>}
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"><Trophy className="w-3 h-3" /> {q.points_per_question || 100}pts</span>
                      {status === "upcoming" && <span className="text-[10px] text-amber-500 font-medium">🔒 Opens {new Date(q.scheduled_at).toLocaleString()}</span>}
                      {status === "expired" && <span className="text-[10px] text-destructive font-medium">⏰ Expired</span>}
                    </div>
                  </div>
                  <Badge variant={status === "done" ? "secondary" : status === "expired" ? "destructive" : status === "upcoming" ? "outline" : "default"} className="text-[10px] shrink-0">
                    {status === "done" ? "Done" : status === "expired" ? "Expired" : status === "upcoming" ? "Upcoming" : "Start"}
                  </Badge>
                </button>
              );
            })}
          </div>
        )}

        {/* Pagination */}
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

export default StudentQuizzes;
