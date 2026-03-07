import { useState, useMemo } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarCheck, CalendarIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { cn } from "@/lib/utils";

const AdminAttendanceHistory = () => {
  const [selectedClassId, setSelectedClassId] = useState("");
  const [dateFrom, setDateFrom] = useState<Date>(startOfMonth(new Date()));
  const [dateTo, setDateTo] = useState<Date>(endOfMonth(new Date()));

  const { data: classes } = useQuery({
    queryKey: ["classes-active"],
    queryFn: async () => {
      const { data } = await supabase.from("classes").select("id, class_name").eq("is_archived", false).order("class_name");
      return data ?? [];
    },
  });

  const { data: students } = useQuery({
    queryKey: ["students", selectedClassId],
    enabled: !!selectedClassId,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name").eq("class_id", selectedClassId).order("full_name");
      return data ?? [];
    },
  });

  const dateFromStr = format(dateFrom, "yyyy-MM-dd");
  const dateToStr = format(dateTo, "yyyy-MM-dd");

  const { data: attendanceRecords } = useQuery({
    queryKey: ["attendance-history", selectedClassId, dateFromStr, dateToStr],
    enabled: !!selectedClassId,
    queryFn: async () => {
      const { data } = await supabase
        .from("attendance")
        .select("student_id, date, status")
        .eq("class_id", selectedClassId)
        .gte("date", dateFromStr)
        .lte("date", dateToStr)
        .order("date");
      return data ?? [];
    },
  });

  const { data: journals } = useQuery({
    queryKey: ["journals-history", selectedClassId, dateFromStr, dateToStr],
    enabled: !!selectedClassId,
    queryFn: async () => {
      const { data } = await supabase
        .from("teaching_journals")
        .select("date, period_label, topic, notes")
        .eq("class_id", selectedClassId)
        .gte("date", dateFromStr)
        .lte("date", dateToStr)
        .order("date");
      return data ?? [];
    },
  });

  // Unique sorted dates
  const uniqueDates = useMemo(() => {
    const dates = new Set<string>();
    attendanceRecords?.forEach(r => dates.add(r.date));
    return Array.from(dates).sort();
  }, [attendanceRecords]);

  // Build attendance map: studentId -> date -> status
  const attMap = useMemo(() => {
    const map: Record<string, Record<string, string>> = {};
    attendanceRecords?.forEach(r => {
      if (!map[r.student_id]) map[r.student_id] = {};
      map[r.student_id][r.date] = r.status;
    });
    return map;
  }, [attendanceRecords]);

  // Build rows
  const rows = useMemo(() => {
    if (!students) return [];
    return students.map(s => {
      const record = attMap[s.id] || {};
      let present = 0, absent = 0, late = 0;
      uniqueDates.forEach(d => {
        const st = record[d];
        if (st === "present") present++;
        else if (st === "absent") absent++;
        else if (st === "late") late++;
      });
      const total = present + absent + late;
      const rate = total > 0 ? (present / total) * 100 : null;
      return { id: s.id, name: s.full_name || "—", record, present, absent, late, total, rate };
    });
  }, [students, attMap, uniqueDates]);

  const statusIcon = (status: string | undefined) => {
    if (status === "present") return <span className="text-green-600 dark:text-green-400 font-bold">✓</span>;
    if (status === "absent") return <span className="text-destructive font-bold">A</span>;
    if (status === "late") return <span className="text-amber-500 font-bold">L</span>;
    return <span className="text-muted-foreground">—</span>;
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold font-display">Riwayat Kehadiran & Jurnal</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Pilih Kelas" />
              </SelectTrigger>
              <SelectContent>
                {classes?.map(c => <SelectItem key={c.id} value={c.id}>{c.class_name}</SelectItem>)}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="text-xs gap-1.5">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {format(dateFrom, "dd MMM", { locale: localeId })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateFrom} onSelect={(d) => d && setDateFrom(d)} className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
            <span className="text-xs text-muted-foreground">—</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="text-xs gap-1.5">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {format(dateTo, "dd MMM", { locale: localeId })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateTo} onSelect={(d) => d && setDateTo(d)} className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {!selectedClassId && (
          <div className="text-center py-16 text-muted-foreground">
            <CalendarCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Pilih kelas untuk melihat riwayat kehadiran</p>
          </div>
        )}

        {selectedClassId && (
          <>
            {/* Attendance Table */}
            <div>
              <h2 className="font-display font-bold text-sm mb-2">Daftar Hadir</h2>
              <div className="border rounded-xl overflow-hidden">
                <ScrollArea className="w-full">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="sticky left-0 z-10 bg-muted/80 backdrop-blur-sm min-w-[150px] font-bold text-xs">Nama Siswa</TableHead>
                        {uniqueDates.map(d => (
                          <TableHead key={d} className="text-center min-w-[50px] text-[10px] px-1">
                            {format(parseISO(d), "dd/MM")}
                          </TableHead>
                        ))}
                        <TableHead className="text-center min-w-[40px] text-[10px] font-bold">H</TableHead>
                        <TableHead className="text-center min-w-[40px] text-[10px] font-bold">A</TableHead>
                        <TableHead className="text-center min-w-[40px] text-[10px] font-bold">L</TableHead>
                        <TableHead className="text-center min-w-[50px] text-[10px] font-bold">%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={99} className="text-center text-muted-foreground py-10">Belum ada data kehadiran</TableCell>
                        </TableRow>
                      ) : rows.map((row, idx) => (
                        <TableRow key={row.id} className={idx % 2 ? "bg-muted/20" : ""}>
                          <TableCell className="sticky left-0 z-10 bg-background font-medium text-xs border-r">{row.name}</TableCell>
                          {uniqueDates.map(d => (
                            <TableCell key={d} className="text-center px-1">{statusIcon(row.record[d])}</TableCell>
                          ))}
                          <TableCell className="text-center text-xs tabular-nums text-green-600 dark:text-green-400 font-semibold">{row.present}</TableCell>
                          <TableCell className="text-center text-xs tabular-nums text-destructive font-semibold">{row.absent}</TableCell>
                          <TableCell className="text-center text-xs tabular-nums text-amber-500 font-semibold">{row.late}</TableCell>
                          <TableCell className="text-center text-xs tabular-nums font-bold">{row.rate !== null ? `${row.rate.toFixed(0)}%` : "—"}</TableCell>
                        </TableRow>
                      ))}
                      {/* Summary row */}
                      {rows.length > 0 && (
                        <TableRow className="border-t-2 border-primary/30 bg-muted/40 font-semibold">
                          <TableCell className="sticky left-0 z-10 bg-muted/60 text-[10px] uppercase tracking-wider border-r">Total</TableCell>
                          {uniqueDates.map(d => {
                            const p = rows.filter(r => r.record[d] === "present").length;
                            return <TableCell key={d} className="text-center text-[10px] tabular-nums">{p}/{rows.length}</TableCell>;
                          })}
                          <TableCell className="text-center text-xs tabular-nums">{rows.reduce((a, r) => a + r.present, 0)}</TableCell>
                          <TableCell className="text-center text-xs tabular-nums">{rows.reduce((a, r) => a + r.absent, 0)}</TableCell>
                          <TableCell className="text-center text-xs tabular-nums">{rows.reduce((a, r) => a + r.late, 0)}</TableCell>
                          <TableCell className="text-center text-xs tabular-nums font-bold">
                            {rows.length ? `${(rows.reduce((a, r) => a + (r.rate ?? 0), 0) / rows.length).toFixed(0)}%` : "—"}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            </div>

            {/* Teaching Journal Table */}
            <div>
              <h2 className="font-display font-bold text-sm mb-2">Jurnal Mengajar</h2>
              <div className="border rounded-xl overflow-hidden">
                <ScrollArea className="w-full">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="min-w-[100px] text-xs font-bold">Tanggal</TableHead>
                        <TableHead className="min-w-[140px] text-xs font-bold">Jam Pelajaran</TableHead>
                        <TableHead className="min-w-[200px] text-xs font-bold">Topik</TableHead>
                        <TableHead className="min-w-[200px] text-xs font-bold">Catatan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!journals?.length ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-10">Belum ada jurnal mengajar</TableCell>
                        </TableRow>
                      ) : journals.map((j, idx) => (
                        <TableRow key={idx} className={idx % 2 ? "bg-muted/20" : ""}>
                          <TableCell className="text-xs">{format(parseISO(j.date), "dd/MM/yyyy")}</TableCell>
                          <TableCell className="text-xs">{j.period_label}</TableCell>
                          <TableCell className="text-xs">{j.topic}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{j.notes || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminAttendanceHistory;
