import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { GraduationCap, Plus, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const AdminClasses = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ["admin-classes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("classes").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { error } = await supabase.from("classes").insert({ class_name: name, description: description || null, join_code: code });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-classes"] });
      setShowCreate(false);
      setName("");
      setDescription("");
      toast.success("Class created!");
    },
    onError: () => toast.error("Failed to create class"),
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-2xl">Classes</h2>
            <p className="text-muted-foreground mt-1">Manage your classes</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="rounded-xl gap-2">
            <Plus className="w-4 h-4" /> New
          </Button>
        </div>

        {isLoading ? (
          <div className="glass rounded-2xl p-8 text-center"><p className="text-muted-foreground text-sm">Loading...</p></div>
        ) : classes.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center space-y-2">
            <GraduationCap className="w-10 h-10 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">No classes yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {classes.map((cls) => (
              <button
                key={cls.id}
                onClick={() => navigate(`/admin/classes/${cls.id}`)}
                className="glass rounded-2xl p-4 w-full text-left flex items-center gap-4 transition-shadow hover:shadow-lg"
              >
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5 text-accent-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display font-bold text-sm truncate">{cls.class_name}</p>
                  {cls.description && <p className="text-xs text-muted-foreground truncate">{cls.description}</p>}
                  {cls.join_code && <p className="text-[10px] text-primary font-mono mt-0.5">Code: {cls.join_code}</p>}
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle className="font-display">New Class</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Class Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl" placeholder="e.g. Class 7A" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description (optional)</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-xl" placeholder="Brief description..." />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => createMutation.mutate()} disabled={!name.trim() || createMutation.isPending} className="rounded-xl w-full">
              {createMutation.isPending ? "Creating..." : "Create Class"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminClasses;
