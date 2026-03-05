import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Trash2, Pencil, Upload, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Material {
  id: string;
  title: string;
  description: string | null;
  type: string;
  file_url: string | null;
  class_id: string | null;
  created_at: string;
}

const MATERIAL_TYPES = ["worksheet", "tutorial", "link"] as const;

const AdminMaterials = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<string>("worksheet");
  const [classId, setClassId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: materials = [], isLoading } = useQuery({
    queryKey: ["materials"],
    queryFn: async () => {
      const { data, error } = await supabase.from("materials").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Material[];
    },
  });

  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data } = await supabase.from("classes").select("id, class_name").order("class_name");
      return data || [];
    },
  });

  const classMap = Object.fromEntries(classes.map((c) => [c.id, c.class_name]));

  const resetForm = () => { setTitle(""); setDescription(""); setType("worksheet"); setClassId(""); setFile(null); setEditing(null); };
  const openCreate = () => { resetForm(); setDialogOpen(true); };
  const openEdit = (m: Material) => {
    setEditing(m); setTitle(m.title); setDescription(m.description || ""); setType(m.type); setClassId(m.class_id || ""); setFile(null); setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      setUploading(true);
      let file_url = editing?.file_url || null;
      if (file) {
        const ext = file.name.split(".").pop();
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("materials").upload(path, file);
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from("materials").getPublicUrl(path);
        file_url = urlData.publicUrl;
      }
      const payload = { title, description: description || null, type, file_url, class_id: classId || null };
      if (editing) {
        const { error } = await supabase.from("materials").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("materials").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      setDialogOpen(false); resetForm(); toast.success(editing ? "Material updated!" : "Material added!"); setUploading(false);
    },
    onError: () => { toast.error("Failed to save material"); setUploading(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("materials").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["materials"] }); toast.success("Material deleted"); },
    onError: () => toast.error("Failed to delete"),
  });

  const typeColor = (t: string) => {
    switch (t) {
      case "worksheet": return "bg-accent text-accent-foreground";
      case "tutorial": return "bg-secondary text-secondary-foreground";
      case "link": return "bg-lavender text-plum";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-2xl">Materials</h2>
            <p className="text-muted-foreground mt-1">Manage learning resources</p>
          </div>
          <Button onClick={openCreate} className="rounded-xl gap-2"><Plus className="w-4 h-4" /> Add</Button>
        </div>

        {isLoading ? (
          <div className="glass rounded-2xl p-8 text-center"><p className="text-muted-foreground text-sm">Loading...</p></div>
        ) : materials.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center space-y-2">
            <FileText className="w-10 h-10 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">No materials yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {materials.map((m) => (
              <div key={m.id} className="glass rounded-2xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge className={`${typeColor(m.type)} rounded-lg text-[10px] font-semibold border-0`}>{m.type}</Badge>
                      {m.class_id && classMap[m.class_id] && (
                        <Badge variant="outline" className="text-[10px] rounded-lg">{classMap[m.class_id]}</Badge>
                      )}
                    </div>
                    <p className="font-display font-bold text-sm truncate">{m.title}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {m.file_url && (
                      <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8" asChild>
                        <a href={m.file_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4" /></a>
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8" onClick={() => openEdit(m)}><Pencil className="w-4 h-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="font-display">Delete Material</AlertDialogTitle>
                          <AlertDialogDescription>This will permanently remove "{m.title}".</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate(m.id)} className="rounded-xl bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                {m.description && <p className="text-sm text-muted-foreground line-clamp-2">{m.description}</p>}
                <p className="text-[10px] text-muted-foreground">{format(new Date(m.created_at), "MMM d, yyyy")}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); resetForm(); } }}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle className="font-display">{editing ? "Edit Material" : "Add Material"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Grammar Worksheet #1" className="rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{MATERIAL_TYPES.map((t) => (<SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Class</label>
                <Select value={classId} onValueChange={setClassId}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="All classes" /></SelectTrigger>
                  <SelectContent>{classes.map((c) => (<SelectItem key={c.id} value={c.id}>{c.class_name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description..." className="rounded-xl min-h-[60px]" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">File (optional)</label>
              <label className="flex items-center gap-2 cursor-pointer glass rounded-xl p-3 hover:bg-accent/40 transition-colors">
                <Upload className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{file ? file.name : "Choose a file..."}</span>
                <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => saveMutation.mutate()} disabled={!title.trim() || uploading || saveMutation.isPending} className="rounded-xl w-full">
              {uploading ? "Uploading..." : saveMutation.isPending ? "Saving..." : editing ? "Save Changes" : "Add Material"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminMaterials;
