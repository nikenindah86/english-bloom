import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Users, Search, Pencil, Eye, MapPin, Phone, Calendar, User, Heart, Download, Trash2 } from "lucide-react";
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

const PAGE_SIZE = 10;

const AdminStudents = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [editStudent, setEditStudent] = useState<StudentProfile | null>(null);
  const [editName, setEditName] = useState("");
  const [viewStudent, setViewStudent] = useState<StudentProfile | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<string[] | null>(null);

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

  const classOptions = useMemo(() => {
    const map = new Map<string, string>();
    students.forEach(s => {
      if (s.class_id && s.class_name) map.set(s.class_id, s.class_name);
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [students]);

  const filtered = useMemo(() => {
    let result = students;
    if (search) result = result.filter(s => (s.full_name || "").toLowerCase().includes(search.toLowerCase()));
    if (classFilter !== "all") result = result.filter(s => s.class_id === classFilter);
    if (genderFilter !== "all") result = result.filter(s => (s.gender || "").toLowerCase() === genderFilter);
    return result;
  }, [students, search, classFilter, genderFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSearch = (v: string) => { setSearch(v); setPage(1); };
  const handleClassFilter = (v: string) => { setClassFilter(v); setPage(1); };
  const handleGenderFilter = (v: string) => { setGenderFilter(v); setPage(1); };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const pageIds = paginated.map(s => s.id);
    const allSelected = pageIds.every(id => selectedIds.has(id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      pageIds.forEach(id => allSelected ? next.delete(id) : next.add(id));
      return next;
    });
  };

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

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { data, error } = await supabase.functions.invoke("delete-students", {
        body: { student_ids: ids },
      });
      if (error) throw error;
      if (data?.errors?.length) {
        console.warn("Partial delete errors:", data.errors);
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-students"] });
      setSelectedIds(new Set());
      setDeleteTarget(null);
      toast.success(`${data.deleted} student(s) deleted`);
    },
    onError: () => {
      toast.error("Failed to delete student(s)");
      setDeleteTarget(null);
    },
  });

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

  const deleteTargetNames = useMemo(() => {
    if (!deleteTarget) return [];
    return deleteTarget.map(id => students.find(s => s.id === id)?.full_name || "Unnamed");
  }, [deleteTarget, students]);

  const allPageSelected = paginated.length > 0 && paginated.every(s => selectedIds.has(s.id));

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

        {/* Filters row */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search students..." value={search} onChange={(e) => handleSearch(e.target.value)} className="pl-10 rounded-xl" />
          </div>
          <Select value={classFilter} onValueChange={handleClassFilter}>
            <SelectTrigger className="rounded-xl w-full sm:w-[160px]">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classOptions.map(([id, name]) => (
                <SelectItem key={id} value={id}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={genderFilter} onValueChange={handleGenderFilter}>
            <SelectTrigger className="rounded-xl w-full sm:w-[140px]">
              <SelectValue placeholder="All Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Gender</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
          {filtered.length > 0 && (
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs shrink-0 h-10" onClick={exportStudents}>
              <Download className="h-3.5 w-3.5" /> CSV
            </Button>
          )}
        </div>

        {/* Bulk action bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-2">
            <span className="text-sm font-medium">{selectedIds.size} selected</span>
            <Button
              variant="destructive"
              size="sm"
              className="rounded-xl gap-1.5 text-xs ml-auto"
              onClick={() => setDeleteTarget(Array.from(selectedIds))}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete Selected
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-muted-foreground text-sm">Loading students...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center space-y-2">
            <Users className="w-10 h-10 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">
              {search || classFilter !== "all" || genderFilter !== "all" ? "No students match your filters" : "No students registered yet"}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={allPageSelected}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all on this page"
                />
                <span className="text-xs text-muted-foreground">Select all</span>
              </div>
              <p className="text-xs text-muted-foreground ml-auto">{filtered.length} student{filtered.length !== 1 ? "s" : ""}</p>
            </div>
            <div className="space-y-3">
              {paginated.map((student) => (
                <div key={student.id} className="glass rounded-2xl p-4 flex items-center gap-4">
                  <Checkbox
                    checked={selectedIds.has(student.id)}
                    onCheckedChange={() => toggleSelect(student.id)}
                    aria-label={`Select ${student.full_name}`}
                    className="shrink-0"
                  />
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteTarget([student.id])}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      className={safePage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                    .map((p, idx, arr) => (
                      <PaginationItem key={p}>
                        {idx > 0 && arr[idx - 1] !== p - 1 && (
                          <span className="px-2 text-muted-foreground">…</span>
                        )}
                        <PaginationLink
                          isActive={p === safePage}
                          onClick={() => setPage(p)}
                          className="cursor-pointer"
                        >
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      className={safePage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
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

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.length === 1 ? "Student" : `${deleteTarget?.length} Students`}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {deleteTarget?.length === 1 ? (
                <strong>{deleteTargetNames[0]}</strong>
              ) : (
                <span><strong>{deleteTarget?.length}</strong> students</span>
              )} and all their related data (grades, submissions, attendance, etc.). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminStudents;
