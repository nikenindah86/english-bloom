import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import StudentLayout from "@/components/student/StudentLayout";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Download, BookOpen, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

const ITEMS_PER_PAGE = 10;

const StudentMaterials = () => {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterType, setFilterType] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: profile } = await supabase.from("profiles").select("class_id").eq("id", user.id).single();
      const classId = profile?.class_id;
      let query = supabase.from("materials").select("*").order("created_at", { ascending: false });
      if (classId) {
        query = query.or(`class_id.eq.${classId},class_id.is.null`);
      } else {
        query = query.is("class_id", null);
      }
      const { data } = await query;
      setMaterials(data || []);
      setLoading(false);
    };
    load();
  }, [user]);

  const types = useMemo(() => [...new Set(materials.map((m) => m.type).filter(Boolean))], [materials]);

  const filtered = useMemo(() => {
    let result = materials.filter((m) => {
      const matchSearch = !search || m.title?.toLowerCase().includes(search.toLowerCase()) || m.description?.toLowerCase().includes(search.toLowerCase());
      const matchType = filterType === "all" || m.type === filterType;
      return matchSearch && matchType;
    });
    result.sort((a, b) => {
      if (sortBy === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === "title") return (a.title || "").localeCompare(b.title || "");
      return 0;
    });
    return result;
  }, [materials, search, sortBy, filterType]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  useEffect(() => { setPage(1); }, [search, sortBy, filterType]);

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h2 className="font-display font-bold text-2xl">Materials 📚</h2>
          <p className="text-muted-foreground mt-1">Worksheets & tutorials from your teacher</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search materials..." className="pl-9 rounded-xl text-sm" />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-36 rounded-xl text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="title">Title A-Z</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-36 rounded-xl text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => (<div key={i} className="glass rounded-2xl p-5 h-24 animate-pulse" />))}</div>
        ) : paginated.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center space-y-2">
            <BookOpen className="w-10 h-10 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">{search || filterType !== "all" ? "No materials match your filter" : "No materials uploaded yet"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {paginated.map((m) => (
              <div key={m.id} className="glass rounded-2xl p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-secondary-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-display font-bold text-sm truncate">{m.title}</p>
                      <Badge variant="secondary" className="mt-1 text-[10px]">{m.type}</Badge>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{format(new Date(m.created_at), "MMM d")}</span>
                </div>
                {m.description && <p className="text-xs text-muted-foreground leading-relaxed">{m.description}</p>}
                {m.file_url && (
                  <Button size="sm" variant="outline" className="w-full rounded-xl text-xs" onClick={() => window.open(m.file_url, "_blank")}>
                    <Download className="w-3.5 h-3.5 mr-1.5" /> Download / View
                  </Button>
                )}
              </div>
            ))}
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

export default StudentMaterials;
