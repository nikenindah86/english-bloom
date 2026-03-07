import { useState, useMemo } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, TableProperties } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const AdminGradeOverview = () => {
  const [selectedClassId, setSelectedClassId] = useState<string>("");

  const { data: classes } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data } = await supabase.from("classes").select("id, class_name").eq("is_archived", false).order("class_name");
      return data ?? [];
    },
  });

  const { data: gradingConfig } = useQuery({
    queryKey: ["grading-config", selectedClassId],
    enabled: !!selectedClassId,
    queryFn: async () => {
      const { data } = await supabase.from("grading_config").select("*").eq("class_id", selectedClassId).maybeSingle();
      return data ?? { quiz_weight: 25, assessment_weight: 25, manual_weight: 25, attendance_weight: 25, passing_grade: 75 };
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

  const { data: quizzes } = useQuery({
    queryKey: ["quizzes-class", selectedClassId],
    enabled: !!selectedClassId,
    queryFn: async () => {
      const { data } = await supabase.from("quizzes").select("id, title").eq("class_id", selectedClassId).order("created_at");
      return data ?? [];
    },
  });

  const { data: quizSubmissions } = useQuery({
    queryKey: ["quiz-subs-class", selectedClassId],
    enabled: !!selectedClassId && !!quizzes,
    queryFn: async () => {
      const quizIds = quizzes?.map(q => q.id) ?? [];
      if (!quizIds.length) return [];
      const { data } = await supabase.from("quiz_submissions").select("student_id, quiz_id, score, status").in("quiz_id", quizIds);
      return data ?? [];
    },
  });

  const { data: assessments } = useQuery({
    queryKey: ["assessments-class", selectedClassId],
    enabled: !!selectedClassId,
    queryFn: async () => {
      const { data } = await supabase.from("assessments").select("id, title").eq("class_id", selectedClassId).order("created_at");
      return data ?? [];
    },
  });

  const { data: assessmentSubmissions } = useQuery({
    queryKey: ["assess-subs-class", selectedClassId],
    enabled: !!selectedClassId && !!assessments,
    queryFn: async () => {
      const ids = assessments?.map(a => a.id) ?? [];
      if (!ids.length) return [];
      const { data } = await supabase.from("assessment_submissions").select("student_id, assessment_id, score, status").in("assessment_id", ids);
      return data ?? [];
    },
  });

  const { data: manualGrades } = useQuery({
    queryKey: ["manual-grades-class", selectedClassId],
    enabled: !!selectedClassId,
    queryFn: async () => {
      const { data } = await supabase.from("manual_grades").select("student_id, title, score, max_score").eq("class_id", selectedClassId);
      return data ?? [];
    },
  });

  const { data: attendance } = useQuery({
    queryKey: ["attendance-class", selectedClassId],
    enabled: !!selectedClassId,
    queryFn: async () => {
      const { data } = await supabase.from("attendance").select("student_id, status").eq("class_id", selectedClassId);
      return data ?? [];
    },
  });

  // Derive unique manual grade titles
  const manualTitles = useMemo(() => {
    const titles = new Set<string>();
    manualGrades?.forEach(g => titles.add(g.title));
    return Array.from(titles).sort();
  }, [manualGrades]);

  // Build row data
  const rows = useMemo(() => {
    if (!students?.length || !gradingConfig) return [];

    return students.map(student => {
      // Quiz scores per quiz
      const quizScores: Record<string, number | null> = {};
      quizzes?.forEach(q => {
        const sub = quizSubmissions?.find(s => s.student_id === student.id && s.quiz_id === q.id && s.status === "graded");
        quizScores[q.id] = sub ? Number(sub.score) : null;
      });
      const quizValues = Object.values(quizScores).filter((v): v is number => v !== null);
      const quizAvg = quizValues.length ? quizValues.reduce((a, b) => a + b, 0) / quizValues.length : null;

      // Assessment scores per assessment
      const assessScores: Record<string, number | null> = {};
      assessments?.forEach(a => {
        const sub = assessmentSubmissions?.find(s => s.student_id === student.id && s.assessment_id === a.id && s.status === "graded");
        assessScores[a.id] = sub ? Number(sub.score) : null;
      });
      const assessValues = Object.values(assessScores).filter((v): v is number => v !== null);
      const assessAvg = assessValues.length ? assessValues.reduce((a, b) => a + b, 0) / assessValues.length : null;

      // Manual grades per title
      const manualScores: Record<string, number | null> = {};
      manualTitles.forEach(title => {
        const grade = manualGrades?.find(g => g.student_id === student.id && g.title === title);
        manualScores[title] = grade ? (Number(grade.score) / Number(grade.max_score)) * 100 : null;
      });
      const manualValues = Object.values(manualScores).filter((v): v is number => v !== null);
      const manualAvg = manualValues.length ? manualValues.reduce((a, b) => a + b, 0) / manualValues.length : null;

      // Attendance
      const studentAtt = attendance?.filter(a => a.student_id === student.id) ?? [];
      const presentCount = studentAtt.filter(a => a.status === "present").length;
      const attRate = studentAtt.length ? (presentCount / studentAtt.length) * 100 : null;

      // Weighted total
      const cfg = gradingConfig;
      let weightedTotal: number | null = null;
      const components: number[] = [];
      let totalWeight = 0;

      if (quizAvg !== null) { components.push(quizAvg * Number(cfg.quiz_weight)); totalWeight += Number(cfg.quiz_weight); }
      if (assessAvg !== null) { components.push(assessAvg * Number(cfg.assessment_weight)); totalWeight += Number(cfg.assessment_weight); }
      if (manualAvg !== null) { components.push(manualAvg * Number(cfg.manual_weight)); totalWeight += Number(cfg.manual_weight); }
      if (attRate !== null) { components.push(attRate * Number(cfg.attendance_weight)); totalWeight += Number(cfg.attendance_weight); }

      if (totalWeight > 0) {
        weightedTotal = components.reduce((a, b) => a + b, 0) / totalWeight;
      }

      const pass = weightedTotal !== null ? weightedTotal >= Number(cfg.passing_grade) : null;

      return {
        id: student.id,
        name: student.full_name || "—",
        quizScores,
        assessScores,
        manualScores,
        quizAvg,
        assessAvg,
        manualAvg,
        attRate,
        weightedTotal,
        pass,
      };
    });
  }, [students, quizzes, quizSubmissions, assessments, assessmentSubmissions, manualGrades, manualTitles, attendance, gradingConfig]);

  // Class averages
  const averages = useMemo(() => {
    if (!rows.length) return null;
    const avg = (vals: (number | null)[]) => {
      const v = vals.filter((x): x is number => x !== null);
      return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
    };

    const quizColAvgs: Record<string, number | null> = {};
    quizzes?.forEach(q => { quizColAvgs[q.id] = avg(rows.map(r => r.quizScores[q.id])); });

    const assessColAvgs: Record<string, number | null> = {};
    assessments?.forEach(a => { assessColAvgs[a.id] = avg(rows.map(r => r.assessScores[a.id])); });

    const manualColAvgs: Record<string, number | null> = {};
    manualTitles.forEach(t => { manualColAvgs[t] = avg(rows.map(r => r.manualScores[t])); });

    return {
      quizColAvgs,
      assessColAvgs,
      manualColAvgs,
      attRate: avg(rows.map(r => r.attRate)),
      weightedTotal: avg(rows.map(r => r.weightedTotal)),
    };
  }, [rows, quizzes, assessments, manualTitles]);

  const fmt = (v: number | null) => (v !== null ? v.toFixed(1) : "—");

  const loading = !classes;

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <TableProperties className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold font-display">Grade Overview</h1>
          </div>
          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Pilih Kelas" />
            </SelectTrigger>
            <SelectContent>
              {classes?.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.class_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!selectedClassId && (
          <div className="text-center py-16 text-muted-foreground">
            <TableProperties className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Pilih kelas untuk melihat rekap nilai</p>
          </div>
        )}

        {selectedClassId && loading && (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        )}

        {selectedClassId && !loading && (
          <>
            {/* Weight info bar */}
            {gradingConfig && (
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="outline">Quiz: {Number(gradingConfig.quiz_weight)}%</Badge>
                <Badge variant="outline">Assessment: {Number(gradingConfig.assessment_weight)}%</Badge>
                <Badge variant="outline">Manual: {Number(gradingConfig.manual_weight)}%</Badge>
                <Badge variant="outline">Attendance: {Number(gradingConfig.attendance_weight)}%</Badge>
                <Badge variant="secondary">Passing Grade: {Number(gradingConfig.passing_grade)}</Badge>
              </div>
            )}

            <div className="border rounded-xl overflow-hidden">
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="sticky left-0 z-10 bg-muted/80 backdrop-blur-sm min-w-[160px] font-bold">Nama Siswa</TableHead>
                      {quizzes?.map(q => (
                        <TableHead key={q.id} className="text-center min-w-[80px] text-xs">
                          <div className="flex flex-col items-center gap-0.5">
                            <Badge variant="default" className="text-[10px] px-1.5">Quiz</Badge>
                            <span className="truncate max-w-[100px]">{q.title}</span>
                          </div>
                        </TableHead>
                      ))}
                      {assessments?.map(a => (
                        <TableHead key={a.id} className="text-center min-w-[80px] text-xs">
                          <div className="flex flex-col items-center gap-0.5">
                            <Badge variant="secondary" className="text-[10px] px-1.5">Assess</Badge>
                            <span className="truncate max-w-[100px]">{a.title}</span>
                          </div>
                        </TableHead>
                      ))}
                      {manualTitles.map(t => (
                        <TableHead key={t} className="text-center min-w-[80px] text-xs">
                          <div className="flex flex-col items-center gap-0.5">
                            <Badge variant="outline" className="text-[10px] px-1.5">Manual</Badge>
                            <span className="truncate max-w-[100px]">{t}</span>
                          </div>
                        </TableHead>
                      ))}
                      <TableHead className="text-center min-w-[60px] text-xs font-bold">Att. %</TableHead>
                      <TableHead className="text-center min-w-[70px] text-xs font-bold">Total</TableHead>
                      <TableHead className="text-center min-w-[70px] text-xs font-bold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={99} className="text-center text-muted-foreground py-10">
                          Belum ada siswa di kelas ini
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {rows.map((row, idx) => (
                          <TableRow key={row.id} className={idx % 2 === 0 ? "" : "bg-muted/20"}>
                            <TableCell className="sticky left-0 z-10 bg-background font-medium text-sm border-r">
                              {row.name}
                            </TableCell>
                            {quizzes?.map(q => (
                              <TableCell key={q.id} className="text-center text-sm tabular-nums">
                                {fmt(row.quizScores[q.id])}
                              </TableCell>
                            ))}
                            {assessments?.map(a => (
                              <TableCell key={a.id} className="text-center text-sm tabular-nums">
                                {fmt(row.assessScores[a.id])}
                              </TableCell>
                            ))}
                            {manualTitles.map(t => (
                              <TableCell key={t} className="text-center text-sm tabular-nums">
                                {fmt(row.manualScores[t])}
                              </TableCell>
                            ))}
                            <TableCell className="text-center text-sm tabular-nums">
                              {row.attRate !== null ? `${row.attRate.toFixed(0)}%` : "—"}
                            </TableCell>
                            <TableCell className={`text-center text-sm font-bold tabular-nums ${
                              row.pass === true ? "text-green-600 dark:text-green-400" :
                              row.pass === false ? "text-destructive" : ""
                            }`}>
                              {fmt(row.weightedTotal)}
                            </TableCell>
                            <TableCell className="text-center">
                              {row.pass === true && <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mx-auto" />}
                              {row.pass === false && <XCircle className="h-4 w-4 text-destructive mx-auto" />}
                              {row.pass === null && <span className="text-muted-foreground text-xs">—</span>}
                            </TableCell>
                          </TableRow>
                        ))}

                        {/* Averages row */}
                        {averages && (
                          <TableRow className="border-t-2 border-primary/30 bg-muted/40 font-semibold">
                            <TableCell className="sticky left-0 z-10 bg-muted/60 text-xs uppercase tracking-wider border-r">
                              Rata-rata Kelas
                            </TableCell>
                            {quizzes?.map(q => (
                              <TableCell key={q.id} className="text-center text-sm tabular-nums">
                                {fmt(averages.quizColAvgs[q.id])}
                              </TableCell>
                            ))}
                            {assessments?.map(a => (
                              <TableCell key={a.id} className="text-center text-sm tabular-nums">
                                {fmt(averages.assessColAvgs[a.id])}
                              </TableCell>
                            ))}
                            {manualTitles.map(t => (
                              <TableCell key={t} className="text-center text-sm tabular-nums">
                                {fmt(averages.manualColAvgs[t])}
                              </TableCell>
                            ))}
                            <TableCell className="text-center text-sm tabular-nums">
                              {averages.attRate !== null ? `${averages.attRate.toFixed(0)}%` : "—"}
                            </TableCell>
                            <TableCell className="text-center text-sm font-bold tabular-nums">
                              {fmt(averages.weightedTotal)}
                            </TableCell>
                            <TableCell />
                          </TableRow>
                        )}
                      </>
                    )}
                  </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminGradeOverview;
