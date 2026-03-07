import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Users, Search, Pencil, Eye, MapPin, Phone, Calendar, User, Heart, Download } from "lucide-react";
import { downloadCSV } from "@/lib/csvExport";
import { toast } from "sonner";
import { format } from "date-fns";

interface StudentProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  class_id: string | null;
  place_of_birth: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  phone: string | null;
  parent_name: string | null;
  class_name?: string | null;
}

const AdminStudents = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editStudent, setEditStudent] = useState<StudentProfile | null>(null);
  const [editName, setEditName] = useState("");
  const [viewStudent, setViewStudent] = useState<StudentProfile | null>(null);

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["admin-students"],
    queryFn: async () => {
      const { data: roles, error: rolesErr } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "student");
      if (rolesErr) throw rolesErr;
      if (!roles.length) return [];

      const studentIds = roles.map((r) => r.user_id);
      const { data: profiles, error: profErr } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, created_at, class_id, place_of_birth, date_of_birth, gender, address, phone, parent_name")
        .in("id", studentIds)
        .order("created_at", { ascending: false });
      if (profErr) throw profErr;

      // Fetch class names
      const classIds = [...new Set((profiles || []).map(p => p.class_id).filter(Boolean))];
      let classMap: Record<string, string> = {};
      if (classIds.length) {
        const { data: classes } = await supabase.from("classes").select("id, class_name").in("id", classIds);
        classMap = Object.fromEntries((classes || []).map(c => [c.id, c.class_name]));
      }

      return (profiles || []).map(p => ({
        ...p,
        class_name: p.class_id ? classMap[p.class_id] || null : null,
      })) as StudentProfile[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, full_name }: { id: string; full_name: string }) => {
      const { error } = await supabase.from("profiles").update({ full_name }).eq("id", id);
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

  const exportStudents = () => {
    const headers = ["Nama", "Kelas", "Jenis Kelamin", "Tempat Lahir", "Tanggal Lahir", "Telepon", "Nama Orang Tua", "Alamat"];
    const csvRows = filtered.map(s => [
      s.full_name || "",
      s.class_name || "",
      s.gender ? s.gender.charAt(0).toUpperCase() + s.gender.slice(1) : "",
      s.place_of_birth || "",
      s.date_of_birth ? format(new Date(s.date_of_birth), "dd/MM/yyyy") : "",
      s.phone || "",
      s.parent_name || "",
      s.address || "",
    ]);
    downloadCSV(headers, csvRows, `Daftar_Siswa.csv`);
  };

  const openEdit = (student: StudentProfile) => {
    setEditStudent(student);
    setEditName(student.full_name || "");
  };

  const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | null }) => (
    <div className="flex items-start gap-3 py-2">
      <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value || "—"}</p>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="font-display font-bold text-2xl">Students</h2>
          <p className="text-muted-foreground mt-1">Manage your student roster</p>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 rounded-xl" />
          </div>
          {filtered.length > 0 && (
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs shrink-0" onClick={exportStudents}>
              <Download className="h-3.5 w-3.5" /> CSV
            </Button>
          )}
        </div>

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
              <div key={student.id} className="glass rounded-2xl p-4 flex items-center gap-4">
                <Avatar className="w-10 h-10 shrink-0">
                  {student.avatar_url && <AvatarImage src={student.avatar_url} alt={student.full_name || ""} />}
                  <AvatarFallback className="bg-accent text-accent-foreground text-sm font-bold">
                    {(student.full_name || "?")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-sm truncate">{student.full_name || "Unnamed Student"}</p>
                  <p className="text-xs text-muted-foreground">
                    {student.class_name || "No class"} · Joined {format(new Date(student.created_at), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setViewStudent(student)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => openEdit(student)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View Detail Dialog */}
      <Dialog open={!!viewStudent} onOpenChange={(open) => !open && setViewStudent(null)}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Student Profile</DialogTitle>
          </DialogHeader>
          {viewStudent && (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3">
                <Avatar className="w-20 h-20">
                  {viewStudent.avatar_url && <AvatarImage src={viewStudent.avatar_url} alt={viewStudent.full_name || ""} />}
                  <AvatarFallback className="bg-accent text-accent-foreground text-2xl font-bold">
                    {(viewStudent.full_name || "?")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <p className="font-display font-bold text-lg">{viewStudent.full_name || "Unnamed Student"}</p>
                  <p className="text-sm text-muted-foreground">{viewStudent.class_name || "No class assigned"}</p>
                </div>
              </div>
              <div className="glass rounded-xl p-4 divide-y divide-border">
                <InfoRow icon={MapPin} label="Place of Birth" value={viewStudent.place_of_birth} />
                <InfoRow icon={Calendar} label="Date of Birth" value={viewStudent.date_of_birth ? format(new Date(viewStudent.date_of_birth), "MMM d, yyyy") : null} />
                <InfoRow icon={User} label="Gender" value={viewStudent.gender ? viewStudent.gender.charAt(0).toUpperCase() + viewStudent.gender.slice(1) : null} />
                <InfoRow icon={MapPin} label="Address" value={viewStudent.address} />
                <InfoRow icon={Phone} label="Phone" value={viewStudent.phone} />
                <InfoRow icon={Heart} label="Parent/Guardian" value={viewStudent.parent_name} />
                <InfoRow icon={Calendar} label="Joined" value={format(new Date(viewStudent.created_at), "MMM d, yyyy")} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editStudent} onOpenChange={(open) => !open && setEditStudent(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Student</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="rounded-xl" />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => editStudent && updateMutation.mutate({ id: editStudent.id, full_name: editName })}
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
