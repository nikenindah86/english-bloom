import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { CalendarCheck, Loader2 } from "lucide-react";

type StudentRow = {
  id: string;
  full_name: string;
  status: "present" | "absent" | "late" | null;
};

const statusColors: Record<string, string> = {
  present: "bg-emerald-100 text-emerald-700 border-emerald-300",
  absent: "bg-red-100 text-red-700 border-red-300",
  late: "bg-amber-100 text-amber-700 border-amber-300",
};

const AdminAttendance = () => {
  const { toast } = useToast();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);

    // Get all students
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "student");

    if (!roles || roles.length === 0) {
      setStudents([]);
      setLoading(false);
      return;
    }

    const studentIds = roles.map((r) => r.user_id);
    const [{ data: profiles }, { data: attendanceData }] = await Promise.all([
      supabase.from("profiles").select("id, full_name").in("id", studentIds),
      supabase.from("attendance").select("*").eq("date", date).in("student_id", studentIds),
    ]);

    const attendanceMap: Record<string, string> = {};
    attendanceData?.forEach((a) => (attendanceMap[a.student_id] = a.status));

    const rows: StudentRow[] = (profiles || []).map((p) => ({
      id: p.id,
      full_name: p.full_name || "Unnamed Student",
      status: (attendanceMap[p.id] as StudentRow["status"]) || null,
    }));

    rows.sort((a, b) => a.full_name.localeCompare(b.full_name));
    setStudents(rows);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [date]);

  const setStatus = async (studentId: string, status: "present" | "absent" | "late") => {
    setSavingId(studentId);

    // Check if record exists
    const { data: existing } = await supabase
      .from("attendance")
      .select("id")
      .eq("student_id", studentId)
      .eq("date", date)
      .maybeSingle();

    if (existing) {
      await supabase.from("attendance").update({ status }).eq("id", existing.id);
    } else {
      await supabase.from("attendance").insert({ student_id: studentId, date, status });
    }

    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status } : s))
    );
    setSavingId(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="font-display font-bold text-2xl">Attendance</h2>
          <p className="text-muted-foreground mt-1">Daily roll call</p>
        </div>

        <div className="flex items-center gap-3">
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-auto rounded-xl"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : students.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center space-y-2">
            <CalendarCheck className="w-10 h-10 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">No students found</p>
          </div>
        ) : (
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
                      disabled={savingId === student.id}
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
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminAttendance;
