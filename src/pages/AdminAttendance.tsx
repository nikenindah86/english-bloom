import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CalendarCheck, Loader2, Save, BookOpen } from "lucide-react";

type StudentRow = {
  id: string;
  full_name: string;
  status: "hadir" | "izin" | "sakit" | "alpha";
};

type JournalEntry = {
  schedule_id: string | null;
  period_label: string;
  topic: string;
  notes: string;
  existing_id?: string;
};

const statusColors: Record<string, string> = {
  hadir: "bg-emerald-100 text-emerald-700 border-emerald-300",
  izin: "bg-blue-100 text-blue-700 border-blue-300",
  sakit: "bg-amber-100 text-amber-700 border-amber-300",
  alpha: "bg-red-100 text-red-700 border-red-300",
};

const statusLabels: Record<string, string> = {
  hadir: "Hadir",
  izin: "Izin",
  sakit: "Sakit",
  alpha: "Alpha",
};

const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

const AdminAttendance = () => {
  const { toast } = useToast();
  const [classes, setClasses] = useState<{ id: string; class_name: string }[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [classesLoading, setClassesLoading] = useState(true);

  // Journal state
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [journalLoading, setJournalLoading] = useState(false);
  const [journalSaving, setJournalSaving] = useState(false);

  // Load classes
  useEffect(() => {
    supabase.from("classes").select("id, class_name").eq("is_archived", false).order("class_name").then(({ data }) => {
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
        full_name: p.full_name || "Siswa Tanpa Nama",
        status: (attendanceMap[p.id] as StudentRow["status"]) || "present",
      }));

      rows.sort((a, b) => a.full_name.localeCompare(b.full_name));
      setStudents(rows);
      setLoading(false);
    };
    fetchStudents();
  }, [selectedClass, date]);

  // Load journal entries when class + date selected
  useEffect(() => {
    if (!selectedClass) {
      setJournalEntries([]);
      return;
    }
    const fetchJournal = async () => {
      setJournalLoading(true);

      const selectedDate = new Date(date + "T00:00:00");
      const dayOfWeek = selectedDate.getDay(); // 0=Sun

      // Fetch schedule periods for this class on this day
      const { data: schedules } = await supabase
        .from("class_schedules")
        .select("id, start_time, end_time, subject, day_of_week")
        .eq("class_id", selectedClass)
        .eq("day_of_week", dayOfWeek)
        .order("start_time");

      // Fetch existing journal entries for this class+date
      const { data: existingJournals } = await supabase
        .from("teaching_journals")
        .select("*")
        .eq("class_id", selectedClass)
        .eq("date", date);

      const existingMap: Record<string, any> = {};
      existingJournals?.forEach((j) => {
        const key = j.schedule_id || j.period_label;
        existingMap[key] = j;
      });

      let entries: JournalEntry[];

      if (schedules && schedules.length > 0) {
        entries = schedules.map((s) => {
          const label = `${s.start_time.slice(0, 5)}–${s.end_time.slice(0, 5)} ${s.subject}`;
          const existing = existingMap[s.id];
          return {
            schedule_id: s.id,
            period_label: label,
            topic: existing?.topic || "",
            notes: existing?.notes || "",
            existing_id: existing?.id,
          };
        });
      } else {
        // No schedule for this day — show a free-form entry
        const freeKey = `${dayNames[dayOfWeek]} – Free Entry`;
        const existing = existingJournals?.find((j) => !j.schedule_id);
        entries = [{
          schedule_id: null,
          period_label: freeKey,
          topic: existing?.topic || "",
          notes: existing?.notes || "",
          existing_id: existing?.id,
        }];
      }

      setJournalEntries(entries);
      setJournalLoading(false);
    };
    fetchJournal();
  }, [selectedClass, date]);

  const setStatus = (studentId: string, status: "present" | "absent" | "late") => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status } : s))
    );
  };

  const updateJournalEntry = (index: number, field: "topic" | "notes", value: string) => {
    setJournalEntries((prev) =>
      prev.map((e, i) => (i === index ? { ...e, [field]: value } : e))
    );
  };

  const handleSave = async () => {
    if (!selectedClass || students.length === 0) return;
    setSaving(true);

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

  const handleSaveJournal = async () => {
    if (!selectedClass) return;
    setJournalSaving(true);

    // Filter entries that have content
    const toSave = journalEntries.filter((e) => e.topic.trim());

    // Delete existing entries for this class+date, then insert fresh
    await supabase
      .from("teaching_journals")
      .delete()
      .eq("class_id", selectedClass)
      .eq("date", date);

    if (toSave.length > 0) {
      const rows = toSave.map((e) => ({
        class_id: selectedClass,
        date,
        schedule_id: e.schedule_id,
        period_label: e.period_label,
        topic: e.topic.trim(),
        notes: e.notes.trim() || null,
      }));

      const { error } = await supabase.from("teaching_journals").insert(rows);
      if (error) {
        toast({ title: "Error", description: "Failed to save journal", variant: "destructive" });
        setJournalSaving(false);
        return;
      }
    }

    setJournalSaving(false);
    toast({ title: "Journal saved!", description: `${toSave.length} entries recorded` });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="font-display font-bold text-2xl">Attendance & Journal</h2>
          <p className="text-muted-foreground mt-1">Session-based roll call & teaching log</p>
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

        {/* Teaching Journal */}
        {selectedClass && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <h3 className="font-display font-bold text-lg">Teaching Journal</h3>
              <span className="text-xs text-muted-foreground ml-auto">
                {dayNames[new Date(date + "T00:00:00").getDay()]}
              </span>
            </div>

            {journalLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {journalEntries.map((entry, idx) => (
                    <div key={idx} className="glass rounded-2xl p-4 space-y-2.5">
                      <div className="text-xs font-bold text-primary/80 tracking-wide uppercase">
                        {entry.period_label}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-muted-foreground">Topic / Material Taught</label>
                        <Input
                          value={entry.topic}
                          onChange={(e) => updateJournalEntry(idx, "topic", e.target.value)}
                          placeholder="e.g. Present Simple Tense, Reading Comprehension"
                          className="rounded-xl text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-muted-foreground">Notes (optional)</label>
                        <Textarea
                          value={entry.notes}
                          onChange={(e) => updateJournalEntry(idx, "notes", e.target.value)}
                          placeholder="Additional notes about the session..."
                          className="rounded-xl text-sm min-h-[60px] resize-none"
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={handleSaveJournal}
                  disabled={journalSaving}
                  variant="outline"
                  className="w-full rounded-xl gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  {journalSaving ? "Saving..." : "Save Journal"}
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminAttendance;
