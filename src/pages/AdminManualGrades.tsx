import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Save, MoreVertical, Pencil, Trash2, PenLine, Download } from "lucide-react";
import { downloadCSV } from "@/lib/csvExport";
import { toast } from "sonner";

type CellKey = `${string}__${string}`; // student_id__category_name

const AdminManualGrades = () => {
  const queryClient = useQueryClient();
  const [selectedClass, setSelectedClass] = useState("");

  // Column CRUD
  const [colDialogOpen, setColDialogOpen] = useState(false);
  const [editingCol, setEditingCol] = useState<{ id: string; name: string; max_score: number } | null>(null);
  const [colName, setColName] = useState("");
  const [colMax, setColMax] = useState("100");

  // Cell data: { "studentId__categoryName": scoreString }
  const [cells, setCells] = useState<Record<CellKey, string>>({});
  const [dirty, setDirty] = useState(false);
  const cellRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data } = await supabase.from("classes").select("id, class_name").eq("is_archived", false).order("class_name");
      return data || [];
    },
  });

  const { data: students = [] } = useQuery({
    queryKey: ["class-students", selectedClass],
    enabled: !!selectedClass,
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "student");
      if (!roles?.length) return [];
      const ids = roles.map((r) => r.user_id);
      const { data } = await supabase.from("profiles").select("id, full_name").in("id", ids).eq("class_id", selectedClass).order("full_name");
      return data || [];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["grade-categories", selectedClass],
    enabled: !!selectedClass,
    queryFn: async () => {
      const { data } = await supabase.from("grade_categories").select("*").eq("class_id", selectedClass).order("order_index");
      return data || [];
    },
  });

  const { data: grades = [] } = useQuery({
    queryKey: ["manual-grades", selectedClass],
    enabled: !!selectedClass,
    queryFn: async () => {
      const { data } = await supabase.from("manual_grades").select("*").eq("class_id", selectedClass);
      return data || [];
    },
  });

  // Populate cells from grades
  useEffect(() => {
    const map: Record<CellKey, string> = {};
    grades.forEach((g) => {
      const key: CellKey = `${g.student_id}__${g.title}`;
      map[key] = String(g.score);
    });
    setCells(map);
    setDirty(false);
  }, [grades]);

  const updateCell = (studentId: string, catName: string, value: string) => {
    const key: CellKey = `${studentId}__${catName}`;
    setCells((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const getScore = (studentId: string, catName: string): string => {
    return cells[`${studentId}__${catName}`] || "";
  };

  // Auto-calc helpers
  const getStudentScores = (studentId: string) => {
    return categories
      .map((c) => {
        const v = getScore(studentId, c.name);
        return v ? Number(v) : null;
      })
      .filter((v): v is number => v !== null);
  };

  const getColScores = (catName: string) => {
    return students
      .map((s) => {
        const v = getScore(s.id, catName);
        return v ? Number(v) : null;
      })
      .filter((v): v is number => v !== null);
  };

  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
  const avg = (arr: number[]) => (arr.length ? sum(arr) / arr.length : 0);

  const selectedClassName = classes.find(c => c.id === selectedClass)?.class_name ?? "Kelas";

  const exportManualGrades = () => {
    const headers = ["No", "Nama Siswa", ...categories.map(c => `${c.name} (max ${c.max_score})`), "Total", "Rata-rata"];
    const csvRows = students.map((s, idx) => {
      const scores = getStudentScores(s.id);
      return [
        String(idx + 1),
        s.full_name || "Unnamed",
        ...categories.map(c => getScore(s.id, c.name) || ""),
        scores.length > 0 ? String(sum(scores)) : "",
        scores.length > 0 ? avg(scores).toFixed(1) : "",
      ];
    });
    downloadCSV(headers, csvRows, `Manual_Grades_${selectedClassName}.csv`);
  };

  // Column mutations
  const saveColMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        class_id: selectedClass,
        name: colName.trim(),
        max_score: Number(colMax),
        order_index: editingCol ? undefined : categories.length,
      };
      if (editingCol) {
        // If name changed, also update manual_grades titles
        if (editingCol.name !== colName.trim()) {
          await supabase.from("manual_grades").update({ title: colName.trim(), max_score: Number(colMax) }).eq("class_id", selectedClass).eq("title", editingCol.name);
        } else {
          await supabase.from("manual_grades").update({ max_score: Number(colMax) }).eq("class_id", selectedClass).eq("title", editingCol.name);
        }
        const { error } = await supabase.from("grade_categories").update({ name: colName.trim(), max_score: Number(colMax) }).eq("id", editingCol.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("grade_categories").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grade-categories", selectedClass] });
      queryClient.invalidateQueries({ queryKey: ["manual-grades", selectedClass] });
      setColDialogOpen(false);
      setEditingCol(null);
      toast.success(editingCol ? "Kolom diperbarui" : "Kolom ditambahkan");
    },
    onError: () => toast.error("Gagal menyimpan kolom"),
  });

  const deleteColMutation = useMutation({
    mutationFn: async (cat: { id: string; name: string }) => {
      await supabase.from("manual_grades").delete().eq("class_id", selectedClass).eq("title", cat.name);
      const { error } = await supabase.from("grade_categories").delete().eq("id", cat.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grade-categories", selectedClass] });
      queryClient.invalidateQueries({ queryKey: ["manual-grades", selectedClass] });
      toast.success("Kolom dihapus");
    },
    onError: () => toast.error("Gagal menghapus kolom"),
  });

  // Save all grades (upsert)
  const saveAllMutation = useMutation({
    mutationFn: async () => {
      const upserts: any[] = [];
      students.forEach((s) => {
        categories.forEach((c) => {
          const v = getScore(s.id, c.name);
          if (v.trim()) {
            upserts.push({
              student_id: s.id,
              class_id: selectedClass,
              title: c.name,
              score: Number(v),
              max_score: c.max_score,
            });
          }
        });
      });
      if (!upserts.length) return;

      // Delete existing then insert (simple upsert strategy)
      await supabase.from("manual_grades").delete().eq("class_id", selectedClass);
      const { error } = await supabase.from("manual_grades").insert(upserts);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manual-grades", selectedClass] });
      setDirty(false);
      toast.success("Semua nilai tersimpan!");
    },
    onError: () => toast.error("Gagal menyimpan"),
  });

  const openAddCol = () => {
    setEditingCol(null);
    setColName("");
    setColMax("100");
    setColDialogOpen(true);
  };

  const openEditCol = (cat: any) => {
    setEditingCol({ id: cat.id, name: cat.name, max_score: cat.max_score });
    setColName(cat.name);
    setColMax(String(cat.max_score));
    setColDialogOpen(true);
  };

  // Tab navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, studentIdx: number, catIdx: number) => {
      if (e.key === "Tab") {
        e.preventDefault();
        let nextCatIdx = catIdx + (e.shiftKey ? -1 : 1);
        let nextStudIdx = studentIdx;
        if (nextCatIdx >= categories.length) {
          nextCatIdx = 0;
          nextStudIdx++;
        } else if (nextCatIdx < 0) {
          nextCatIdx = categories.length - 1;
          nextStudIdx--;
        }
        if (nextStudIdx >= 0 && nextStudIdx < students.length) {
          const key = `${nextStudIdx}-${nextCatIdx}`;
          cellRefs.current[key]?.focus();
        }
      }
    },
    [categories.length, students.length]
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-display font-bold text-2xl">Manual Grades</h2>
            <p className="text-muted-foreground mt-1 text-sm">Spreadsheet-style grading per class</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="rounded-xl w-full sm:w-48">
                <SelectValue placeholder="Pilih Kelas" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.class_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {students.length > 0 && categories.length > 0 && (
              <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs" onClick={exportManualGrades}>
                <Download className="h-3.5 w-3.5" /> CSV
              </Button>
            )}
          </div>
        </div>

        {!selectedClass ? (
          <div className="glass rounded-2xl p-12 text-center space-y-3">
            <PenLine className="w-10 h-10 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">Pilih kelas untuk mulai input nilai</p>
          </div>
        ) : students.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <p className="text-muted-foreground text-sm">Tidak ada siswa di kelas ini</p>
          </div>
        ) : (
          <div className="glass rounded-2xl p-4 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium text-muted-foreground sticky left-0 bg-card z-10 min-w-[140px]">#</th>
                    <th className="text-left p-2 font-medium text-muted-foreground sticky left-[140px] bg-card z-10 min-w-[160px]">Nama Siswa</th>
                    {categories.map((cat) => (
                      <th key={cat.id} className="text-center p-2 min-w-[110px]">
                        <div className="flex items-center justify-center gap-1">
                          <div>
                            <div className="font-medium text-xs truncate max-w-[90px]" title={cat.name}>{cat.name}</div>
                            <div className="text-[10px] text-muted-foreground font-normal">max: {cat.max_score}</div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg">
                                <MoreVertical className="w-3 h-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditCol(cat)}>
                                <Pencil className="w-3 h-3 mr-2" /> Edit
                              </DropdownMenuItem>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                    <Trash2 className="w-3 h-3 mr-2" /> Hapus
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-2xl">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Hapus Kolom "{cat.name}"?</AlertDialogTitle>
                                    <AlertDialogDescription>Semua nilai untuk kolom ini akan dihapus permanen.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteColMutation.mutate(cat)} className="rounded-xl bg-destructive text-destructive-foreground">Hapus</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </th>
                    ))}
                    <th className="text-center p-2 min-w-[80px] font-medium text-muted-foreground">∑ Total</th>
                    <th className="text-center p-2 min-w-[80px] font-medium text-muted-foreground">Rata²</th>
                    <th className="p-2 min-w-[50px]">
                      <Button variant="outline" size="sm" className="rounded-xl gap-1 text-xs h-7" onClick={openAddCol}>
                        <Plus className="w-3 h-3" /> Kolom
                      </Button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, sIdx) => {
                    const scores = getStudentScores(student.id);
                    const total = sum(scores);
                    const average = avg(scores);
                    return (
                      <tr key={student.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-2 text-muted-foreground text-xs sticky left-0 bg-card">{sIdx + 1}</td>
                        <td className="p-2 font-medium truncate max-w-[160px] sticky left-[140px] bg-card" title={student.full_name || ""}>{student.full_name || "Unnamed"}</td>
                        {categories.map((cat, cIdx) => (
                          <td key={cat.id} className="p-1 text-center">
                            <Input
                              ref={(el) => { cellRefs.current[`${sIdx}-${cIdx}`] = el; }}
                              type="number"
                              value={getScore(student.id, cat.name)}
                              onChange={(e) => updateCell(student.id, cat.name, e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, sIdx, cIdx)}
                              className="rounded-lg h-8 text-sm text-center w-20 mx-auto"
                              placeholder="—"
                              min={0}
                              max={cat.max_score}
                            />
                          </td>
                        ))}
                        <td className="p-2 text-center font-semibold text-sm">{scores.length > 0 ? total : "—"}</td>
                        <td className="p-2 text-center font-semibold text-sm">{scores.length > 0 ? average.toFixed(1) : "—"}</td>
                        <td />
                      </tr>
                    );
                  })}
                </tbody>
                {categories.length > 0 && students.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 bg-muted/20">
                      <td className="p-2 sticky left-0 bg-muted/20" />
                      <td className="p-2 font-medium text-xs text-muted-foreground sticky left-[140px] bg-muted/20">Rata² Kelas</td>
                      {categories.map((cat) => {
                        const colScores = getColScores(cat.name);
                        return (
                          <td key={cat.id} className="p-2 text-center font-semibold text-xs text-muted-foreground">
                            {colScores.length > 0 ? avg(colScores).toFixed(1) : "—"}
                          </td>
                        );
                      })}
                      <td />
                      <td />
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {categories.length === 0 && (
              <div className="text-center py-6 text-muted-foreground text-sm">
                Belum ada kolom nilai. Klik <strong>"+ Kolom"</strong> untuk menambahkan jenis ujian.
              </div>
            )}

            {categories.length > 0 && (
              <div className="flex justify-end">
                <Button
                  onClick={() => saveAllMutation.mutate()}
                  disabled={!dirty || saveAllMutation.isPending}
                  className="rounded-xl gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saveAllMutation.isPending ? "Menyimpan..." : "Simpan Semua Nilai"}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Column add/edit dialog */}
      <Dialog open={colDialogOpen} onOpenChange={(open) => { if (!open) { setColDialogOpen(false); setEditingCol(null); } }}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">{editingCol ? "Edit Kolom" : "Tambah Kolom"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Kolom</label>
              <Input value={colName} onChange={(e) => setColName(e.target.value)} placeholder="e.g. Ulangan Harian 1" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Skor Maksimum</label>
              <Input type="number" value={colMax} onChange={(e) => setColMax(e.target.value)} className="rounded-xl" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => saveColMutation.mutate()} disabled={!colName.trim() || saveColMutation.isPending} className="rounded-xl w-full">
              {saveColMutation.isPending ? "Menyimpan..." : editingCol ? "Simpan Perubahan" : "Tambah Kolom"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminManualGrades;
