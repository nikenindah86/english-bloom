import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Plus, X, Link2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";

interface CreateAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateAssignmentDialog = ({ open, onOpenChange }: CreateAssignmentDialogProps) => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [classId, setClassId] = useState("");
  const [dueDate, setDueDate] = useState<Date>();
  const [maxScore, setMaxScore] = useState("100");
  const [scheduledAt, setScheduledAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
  const [newMaterials, setNewMaterials] = useState<{ title: string; type: string; file_url: string }[]>([]);
  const [newMatTitle, setNewMatTitle] = useState("");
  const [newMatType, setNewMatType] = useState("link");
  const [newMatUrl, setNewMatUrl] = useState("");

  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data } = await supabase.from("classes").select("id, class_name").eq("is_archived", false);
      return data || [];
    },
  });

  const { data: existingMaterials = [] } = useQuery({
    queryKey: ["materials-for-class", classId],
    queryFn: async () => {
      let query = supabase.from("materials").select("id, title, type, file_url");
      if (classId) query = query.eq("class_id", classId);
      const { data } = await query.order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!classId,
  });

  const toggleMaterial = (id: string) => {
    setSelectedMaterialIds(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const addNewMaterial = () => {
    if (!newMatTitle.trim() || !newMatUrl.trim()) return;
    setNewMaterials(prev => [...prev, { title: newMatTitle, type: newMatType, file_url: newMatUrl }]);
    setNewMatTitle(""); setNewMatUrl(""); setNewMatType("link");
  };

  const removeNewMaterial = (idx: number) => {
    setNewMaterials(prev => prev.filter((_, i) => i !== idx));
  };

  const resetForm = () => {
    setTitle(""); setDescription(""); setClassId(""); setDueDate(undefined);
    setMaxScore("100"); setSelectedMaterialIds([]); setNewMaterials([]);
    setNewMatTitle(""); setNewMatUrl(""); setNewMatType("link");
    setScheduledAt(""); setExpiresAt("");
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      // 1. Create assignment
      const { data: assignment, error } = await supabase.from("assignments").insert({
        title, description: description || null, class_id: classId,
        due_date: dueDate?.toISOString() || null, max_score: Number(maxScore) || 100,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      }).select("id").single();
      if (error || !assignment) throw error;

      const linkRows: { assignment_id: string; material_id: string }[] = [];

      // 2. Link existing materials
      for (const matId of selectedMaterialIds) {
        linkRows.push({ assignment_id: assignment.id, material_id: matId });
      }

      // 3. Create new materials, then link
      for (const mat of newMaterials) {
        const { data: newMat, error: matErr } = await supabase.from("materials").insert({
          title: mat.title, type: mat.type, file_url: mat.file_url, class_id: classId,
        }).select("id").single();
        if (matErr || !newMat) throw matErr;
        linkRows.push({ assignment_id: assignment.id, material_id: newMat.id });
      }

      // 4. Insert junction rows
      if (linkRows.length > 0) {
        const { error: linkErr } = await supabase.from("assignment_materials").insert(linkRows);
        if (linkErr) throw linkErr;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      onOpenChange(false);
      resetForm();
      toast.success("Assignment created!");
    },
    onError: () => toast.error("Failed to create assignment"),
  });

  const totalAttached = selectedMaterialIds.length + newMaterials.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display">New Assignment</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className="rounded-xl" />
          <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description..." className="rounded-xl" />
          <Select value={classId} onValueChange={v => { setClassId(v); setSelectedMaterialIds([]); }}>
            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select class" /></SelectTrigger>
            <SelectContent>{classes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.class_name}</SelectItem>)}</SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full rounded-xl justify-start text-left font-normal", !dueDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />{dueDate ? format(dueDate, "PPP") : "Pick due date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
          <Input value={maxScore} onChange={e => setMaxScore(e.target.value)} placeholder="Max Score" type="number" className="rounded-xl" />

          {/* Scheduling */}
          <div className="border-t border-border pt-3 space-y-2">
            <p className="text-sm font-medium">📅 Scheduling (optional)</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Scheduled At</label>
                <Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} className="rounded-xl text-xs h-9" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Expires At</label>
                <Input type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} className="rounded-xl text-xs h-9" />
              </div>
            </div>
          </div>

          {/* Attach Materials Section */}
          {classId && (
            <div className="space-y-3 border rounded-xl p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Attach Materials</p>
                {totalAttached > 0 && <Badge variant="secondary" className="text-[10px]">{totalAttached} attached</Badge>}
              </div>
              <Tabs defaultValue="existing" className="w-full">
                <TabsList className="w-full rounded-xl">
                  <TabsTrigger value="existing" className="flex-1 rounded-lg text-xs">Select Existing</TabsTrigger>
                  <TabsTrigger value="new" className="flex-1 rounded-lg text-xs">Add New</TabsTrigger>
                </TabsList>
                <TabsContent value="existing" className="space-y-2 max-h-40 overflow-y-auto mt-2">
                  {existingMaterials.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-3">No materials for this class</p>
                  ) : existingMaterials.map((m: any) => (
                    <label key={m.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer text-sm">
                      <Checkbox
                        checked={selectedMaterialIds.includes(m.id)}
                        onCheckedChange={() => toggleMaterial(m.id)}
                      />
                      <span className="truncate flex-1">{m.title}</span>
                      <Badge variant="outline" className="text-[10px] shrink-0">{m.type}</Badge>
                    </label>
                  ))}
                </TabsContent>
                <TabsContent value="new" className="space-y-3 mt-2">
                  {newMaterials.map((m, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg text-xs">
                      <FileText className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate flex-1">{m.title}</span>
                      <Badge variant="outline" className="text-[10px]">{m.type}</Badge>
                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md" onClick={() => removeNewMaterial(i)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  <Input value={newMatTitle} onChange={e => setNewMatTitle(e.target.value)} placeholder="Material title" className="rounded-xl text-sm h-9" />
                  <Select value={newMatType} onValueChange={setNewMatType}>
                    <SelectTrigger className="rounded-xl h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="link">Link</SelectItem>
                      <SelectItem value="worksheet">Worksheet</SelectItem>
                      <SelectItem value="tutorial">Tutorial</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="document">Document</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Input value={newMatUrl} onChange={e => setNewMatUrl(e.target.value)} placeholder="URL / Link" className="rounded-xl text-sm h-9 flex-1" />
                    <Button size="sm" variant="outline" className="rounded-xl h-9 gap-1" onClick={addNewMaterial} disabled={!newMatTitle.trim() || !newMatUrl.trim()}>
                      <Plus className="w-3 h-3" /> Add
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={() => createMutation.mutate()} disabled={!title.trim() || !classId || createMutation.isPending} className="rounded-xl w-full">
            {createMutation.isPending ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAssignmentDialog;
