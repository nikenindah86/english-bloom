import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import StudentLayout from "@/components/student/StudentLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { FileCheck, Upload } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const StudentAssignments = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [submitDialog, setSubmitDialog] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);

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

  const getSubmission = (assignmentId: string) => mySubmissions.find((s: any) => s.assignment_id === assignmentId);

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h2 className="font-display font-bold text-2xl">Assignments</h2>
          <p className="text-muted-foreground mt-1">Your tasks and submissions</p>
        </div>

        {!profile?.class_id ? (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-sm text-muted-foreground">Join a class to see assignments</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <FileCheck className="w-10 h-10 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium mt-2">No assignments yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map((a: any) => {
              const sub = getSubmission(a.id);
              const isOverdue = a.due_date && new Date(a.due_date) < new Date() && !sub;
              return (
                <div key={a.id} className={`glass rounded-2xl p-4 space-y-2 ${isOverdue ? "border border-destructive/30" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-display font-bold text-sm">{a.title}</p>
                      {a.description && <p className="text-xs text-muted-foreground">{a.description}</p>}
                    </div>
                    {sub ? (
                      <Badge variant={sub.status === "graded" ? "default" : "secondary"} className="text-[10px] shrink-0">
                        {sub.status === "graded" ? `Score: ${sub.score}` : "Submitted"}
                      </Badge>
                    ) : (
                      <Button size="sm" className="rounded-xl text-xs shrink-0 gap-1" onClick={() => setSubmitDialog(a.id)}>
                        <Upload className="w-3 h-3" /> Submit
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {a.due_date && (
                      <Badge variant={isOverdue ? "destructive" : "outline"} className="text-[10px]">
                        Due: {format(new Date(a.due_date), "MMM d, yyyy")}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-[10px]">Max: {a.max_score}</Badge>
                  </div>
                  {sub?.feedback && <p className="text-xs text-primary italic">Feedback: {sub.feedback}</p>}
                </div>
              );
            })}
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
