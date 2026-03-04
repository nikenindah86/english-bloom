import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CalendarCheck, Loader2, Save } from "lucide-react";

type StudentRow = {
  id: string;
  full_name: string;
  status: "present" | "absent" | "late";
};

const statusColors: Record<string, string> = {
  present: "bg-emerald-100 text-emerald-700 border-emerald-300",
  absent: "bg-red-100 text-red-700 border-red-300",
  late: "bg-amber-100 text-amber-700 border-amber-300",
};

const AdminAttendance = () => {
  const { toast } = useToast();
  const [classes, setClasses] = useState<{ id: string; class_name: string }[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [classesLoading, setClassesLoading] = useState(true);

  // Load classes
  useEffect(() => {
    supabase.from("classes").select("id, class_name").order("class_name").then(({ data }) => {
      setClasses(data || []);
      setClassesLoading(false);
    });
  }, []);

  // Load students when class + date selected
  useEffect(() => {
    if (!selectedClass) {
      setStudents([]);
      return;
    }
    const fetchStudents = async () => {
      setLoading(true);

      const [{ data: profiles }, { data: attendanceData }] = await Promise.all([
        supabase.from("profiles").select("id, full_name").eq("class_id", selectedClass),
        supabase.from("attendance").select("student_id, status").eq("class_id", selectedClass).eq("date", date),
      ]);

      const attendanceMap: Record<string, string> = {};
      attendanceData?.forEach((a) => (attendanceMap[a.student_id] = a.status));

      const rows: StudentRow[] = (profiles || []).map((p) => ({
        id: p.id,
        full_name: p.full_name || "Unnamed Student",
        status: (attendanceMap[p.id] as StudentRow["status"]) || "present",
      }));

      rows.sort((a, b) => a.full_name.localeCompare(b.full_name));
      setStudents(rows);
      setLoading(false);
    };
    fetchStudents();
  }, [selectedClass, date]);

  const setStatus = (studentId: string, status: "present" | "absent" | "late") => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status } : s))
    );
  };

  const handleSave = async () => {
    if (!selectedClass || students.length === 0) return;
    setSaving(true);

    // Delete existing records for this class+date, then insert fresh
    await supabase
      .from("attendance")
      .delete()
      .eq("class_id", selectedClass)
      .eq("date", date);

    const rows = students.map((s) => ({
      student_id: s.id,
      class_id: selectedClass,
      date,
      status: s.status,
    }));

    const { error } = await supabase.from("attendance").insert(rows);
    setSaving(false);

    if (error) {
      toast({ title: "Error", description: "Failed to save attendance", variant: "destructive" });
    } else {
      toast({ title: "Saved!", description: `Attendance saved for ${students.length} students` });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="font-display font-bold text-2xl">Attendance</h2>
          <p className="text-muted-foreground mt-1">Session-based roll call</p>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Class</label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder={classesLoading ? "Loading..." : "Select class"} />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.class_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Date</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl"
            />
          </div>
        </div>

        {/* Student List */}
        {!selectedClass ? (
          <div className="glass rounded-2xl p-8 text-center space-y-2">
            <CalendarCheck className="w-10 h-10 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium text-sm">Select a class to begin</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : students.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center space-y-2">
            <CalendarCheck className="w-10 h-10 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium text-sm">No students in this class</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="glass rounded-2xl p-3 flex items-center justify-between gap-2"
                >
                  <span className="text-sm font-medium truncate flex-1">{student.full_name}</span>
                  <div className="flex gap-1">
                    {(["present", "absent", "late"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatus(student.id, s)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all capitalize ${
                          student.status === s
                            ? statusColors[s]
                            : "bg-muted/50 text-muted-foreground border-transparent hover:border-border"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-xl gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Attendance"}
            </Button>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminAttendance;
