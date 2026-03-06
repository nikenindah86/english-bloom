import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import StudentLayout from "@/components/student/StudentLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileCheck, Upload, Paperclip, ExternalLink, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const ITEMS_PER_PAGE = 10;

const StudentAssignments = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [submitDialog, setSubmitDialog] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("due_date");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);

  const { data: profile } = useQuery({
    queryKey: ["my-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("class_id").eq("id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["student-assignments", profile?.class_id],
    queryFn: async () => {
      if (!profile?.class_id) return [];
      const { data } = await supabase.from("assignments").select("*").eq("class_id", profile.class_id).order("due_date", { ascending: true });
      return data || [];
    },
    enabled: !!profile?.class_id,
  });

  const { data: mySubmissions = [] } = useQuery({
    queryKey: ["my-assignment-submissions", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("assignment_submissions").select("*").eq("student_id", user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  const assignmentIds = assignments.map((a: any) => a.id);
  const { data: assignmentMaterials = [] } = useQuery({
    queryKey: ["assignment-materials", assignmentIds],
    queryFn: async () => {
      if (assignmentIds.length === 0) return [];
      const { data } = await supabase.from("assignment_materials").select("assignment_id, materials(id, title, type, file_url)").in("assignment_id", assignmentIds);
      return data || [];
    },
    enabled: assignmentIds.length > 0,
  });

  const getMaterials = (assignmentId: string) => assignmentMaterials.filter((am: any) => am.assignment_id === assignmentId).map((am: any) => am.materials).filter(Boolean);
  const getSubmission = (assignmentId: string) => mySubmissions.find((s: any) => s.assignment_id === assignmentId);

  const getStatus = (a: any) => {
    const sub = getSubmission(a.id);
    if (sub) return sub.status === "graded" ? "graded" : "submitted";
    const now = new Date();
    if (a.expires_at && new Date(a.expires_at) < now) return "expired";
    if (a.scheduled_at && new Date(a.scheduled_at) > now) return "upcoming";
    if (a.due_date && new Date(a.due_date) < now) return "overdue";
    return "pending";
  };

  const filtered = useMemo(() => {
    let result = assignments.filter((a: any) => {
      const matchSearch = !search || a.title?.toLowerCase().includes(search.toLowerCase()) || a.description?.toLowerCase().includes(search.toLowerCase());
      const status = getStatus(a);
      const matchFilter = filterStatus === "all" || status === filterStatus;
      return matchSearch && matchFilter;
    });
    result.sort((a: any, b: any) => {
      if (sortBy === "due_date") return new Date(a.due_date || "9999").getTime() - new Date(b.due_date || "9999").getTime();
      if (sortBy === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === "status") {
        const order = { pending: 0, overdue: 1, upcoming: 2, submitted: 3, graded: 4, expired: 5 };
        return (order[getStatus(a) as keyof typeof order] || 0) - (order[getStatus(b) as keyof typeof order] || 0);
      }
      return 0;
    });
    return result;
  }, [assignments, mySubmissions, search, sortBy, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  useEffect(() => { setPage(1); }, [search, sortBy, filterStatus]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      let fileUrl = null;
      if (file) {
        const ext = file.name.split(".").pop();
        const path = `${user!.id}/${submitDialog}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("assignments").upload(path, file);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("assignments").getPublicUrl(path);
        fileUrl = urlData.publicUrl;
      }
      const { error } = await supabase.from("assignment_submissions").insert({
        assignment_id: submitDialog!, student_id: user!.id,
        file_url: fileUrl, note: note || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-assignment-submissions"] });
      setSubmitDialog(null); setNote(""); setFile(null);
      toast.success("Submitted!");
    },
    onError: () => toast.error("Failed to submit"),
  });

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h2 className="font-display font-bold text-2xl">Assignments</h2>
          <p className="text-muted-foreground mt-1">Your tasks and submissions</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search assignments..." className="pl-9 rounded-xl text-sm" />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-36 rounded-xl text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="due_date">Due Date</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-36 rounded-xl text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="graded">Graded</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!profile?.class_id ? (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-sm text-muted-foreground">Join a class to see assignments</p>
          </div>
        ) : paginated.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <FileCheck className="w-10 h-10 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium mt-2">{search || filterStatus !== "all" ? "No assignments match your filter" : "No assignments yet"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {paginated.map((a: any) => {
              const sub = getSubmission(a.id);
              const status = getStatus(a);
              const materials = getMaterials(a.id);
              const canSubmit = !sub && status !== "expired" && status !== "upcoming";
              return (
                <div key={a.id} className={`glass rounded-2xl p-4 space-y-2 ${status === "overdue" ? "border border-destructive/30" : ""} ${status === "expired" ? "opacity-60" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-display font-bold text-sm">{a.title}</p>
                      {a.description && <p className="text-xs text-muted-foreground">{a.description}</p>}
                    </div>
                    {sub ? (
                      <Badge variant={sub.status === "graded" ? "default" : "secondary"} className="text-[10px] shrink-0">
                        {sub.status === "graded" ? `Score: ${sub.score}` : "Submitted"}
                      </Badge>
                    ) : canSubmit ? (
                      <Button size="sm" className="rounded-xl text-xs shrink-0 gap-1" onClick={() => setSubmitDialog(a.id)}>
                        <Upload className="w-3 h-3" /> Submit
                      </Button>
                    ) : status === "expired" ? (
                      <Badge variant="destructive" className="text-[10px] shrink-0">⏰ Expired</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] shrink-0">🔒 Upcoming</Badge>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {a.due_date && (
                      <Badge variant={status === "overdue" ? "destructive" : "outline"} className="text-[10px]">
                        Due: {format(new Date(a.due_date), "MMM d, yyyy")}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-[10px]">Max: {a.max_score}</Badge>
                    {status === "upcoming" && <Badge variant="outline" className="text-[10px]">Opens {new Date(a.scheduled_at).toLocaleString()}</Badge>}
                  </div>
                  {materials.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1"><Paperclip className="w-3 h-3" /> Materials</p>
                      <div className="flex flex-wrap gap-1.5">
                        {materials.map((m: any) => (
                          <a key={m.id} href={m.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline bg-primary/5 rounded-lg px-2 py-1">
                            <ExternalLink className="w-3 h-3" />{m.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {sub?.feedback && <p className="text-xs text-primary italic">Feedback: {sub.feedback}</p>}
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

      <Dialog open={!!submitDialog} onOpenChange={() => setSubmitDialog(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle className="font-display">Submit Assignment</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Upload File</label>
              <Input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="rounded-xl" />
            </div>
            <Textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Note (optional)" className="rounded-xl" />
          </div>
          <DialogFooter>
            <Button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending} className="rounded-xl w-full">
              {submitMutation.isPending ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StudentLayout>
  );
};

export default StudentAssignments;
