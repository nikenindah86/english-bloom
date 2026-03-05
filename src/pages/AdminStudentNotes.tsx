import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StickyNote, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const AdminStudentNotes = () => {
  const queryClient = useQueryClient();
  const [selectedStudent, setSelectedStudent] = useState("");
  const [newNote, setNewNote] = useState("");

  const { data: students = [] } = useQuery({
    queryKey: ["all-students"],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "student");
      if (!roles?.length) return [];
      const ids = roles.map(r => r.user_id);
      const { data } = await supabase.from("profiles").select("id, full_name, class_id, classes:class_id(class_name)").in("id", ids);
      return data || [];
    },
  });

  const { data: notes = [] } = useQuery({
    queryKey: ["student-notes", selectedStudent],
    queryFn: async () => {
      if (!selectedStudent) return [];
      const { data } = await supabase.from("student_notes").select("*").eq("student_id", selectedStudent).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!selectedStudent,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const student = students.find((s: any) => s.id === selectedStudent);
      const { error } = await supabase.from("student_notes").insert({
        student_id: selectedStudent, content: newNote, class_id: student?.class_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-notes", selectedStudent] });
      setNewNote("");
      toast.success("Note added!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("student_notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-notes", selectedStudent] });
      toast.success("Deleted");
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="font-display font-bold text-2xl">Student Notes</h2>
          <p className="text-muted-foreground mt-1">Private notes about students</p>
        </div>

        <Select value={selectedStudent} onValueChange={setSelectedStudent}>
          <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select a student" /></SelectTrigger>
          <SelectContent>
            {students.map((s: any) => (
              <SelectItem key={s.id} value={s.id}>{s.full_name || "Unnamed"} {s.classes?.class_name ? `(${s.classes.class_name})` : ""}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedStudent && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Write a note..." className="rounded-xl flex-1" />
              <Button onClick={() => addMutation.mutate()} disabled={!newNote.trim()} className="rounded-xl self-end" size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {notes.length === 0 ? (
              <div className="glass rounded-2xl p-6 text-center">
                <StickyNote className="w-8 h-8 mx-auto text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground mt-2">No notes for this student</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notes.map((n: any) => (
                  <div key={n.id} className="glass rounded-xl p-3 flex gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm whitespace-pre-wrap">{n.content}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(n.created_at), "MMM d, yyyy HH:mm")}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 text-destructive shrink-0" onClick={() => deleteMutation.mutate(n.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminStudentNotes;
