import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Users, Search, Pencil } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface StudentProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

const AdminStudents = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editStudent, setEditStudent] = useState<StudentProfile | null>(null);
  const [editName, setEditName] = useState("");

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["admin-students"],
    queryFn: async () => {
      // Get all student user_ids
      const { data: roles, error: rolesErr } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "student");
      if (rolesErr) throw rolesErr;
      if (!roles.length) return [];

      const studentIds = roles.map((r) => r.user_id);
      const { data: profiles, error: profErr } = await supabase
        .from("profiles")
        .select("*")
        .in("id", studentIds)
        .order("created_at", { ascending: false });
      if (profErr) throw profErr;
      return profiles as StudentProfile[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, full_name }: { id: string; full_name: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-students"] });
      setEditStudent(null);
      toast.success("Student updated!");
    },
    onError: () => toast.error("Failed to update student"),
  });

  const filtered = students.filter((s) =>
    (s.full_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (student: StudentProfile) => {
    setEditStudent(student);
    setEditName(student.full_name || "");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="font-display font-bold text-2xl">Students</h2>
          <p className="text-muted-foreground mt-1">Manage your student roster</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>

        {/* Student list */}
        {isLoading ? (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-muted-foreground text-sm">Loading students...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center space-y-2">
            <Users className="w-10 h-10 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">
              {search ? "No students match your search" : "No students registered yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((student) => (
              <div
                key={student.id}
                className="glass rounded-2xl p-4 flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-accent-foreground">
                    {(student.full_name || "?")[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-sm truncate">
                    {student.full_name || "Unnamed Student"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Joined {format(new Date(student.created_at), "MMM d, yyyy")}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl shrink-0"
                  onClick={() => openEdit(student)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editStudent} onOpenChange={(open) => !open && setEditStudent(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Student</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() =>
                editStudent &&
                updateMutation.mutate({ id: editStudent.id, full_name: editName })
              }
              disabled={updateMutation.isPending}
              className="rounded-xl w-full"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminStudents;
