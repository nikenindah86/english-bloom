import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, TrendingUp, TrendingDown, Sparkles } from "lucide-react";

type Props = { userId: string; classId: string };

const CircularProgress = ({ value, passingGrade, size = 160, strokeWidth = 12 }: { value: number; passingGrade: number; size?: number; strokeWidth?: number }) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedValue / 100) * circumference;
  const passingOffset = circumference - (passingGrade / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(Math.min(value, 100)), 200);
    return () => clearTimeout(timer);
  }, [value]);

  const color = value >= passingGrade ? "hsl(var(--chart-2))" : value >= passingGrade - 10 ? "hsl(var(--chart-3))" : "hsl(var(--destructive))";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
        {/* Passing grade marker */}
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted-foreground) / 0.3)" strokeWidth={strokeWidth}
          strokeDasharray={`2 ${circumference - 2}`} strokeDashoffset={passingOffset} strokeLinecap="round"
        />
        {/* Progress */}
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <CountUp value={Math.round(value)} />
        <span className="text-[10px] text-muted-foreground font-medium mt-0.5">/ 100</span>
      </div>
    </div>
  );
};

const CountUp = ({ value }: { value: number }) => {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>();

  useEffect(() => {
    let start = 0;
    const duration = 1000;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) ref.current = requestAnimationFrame(animate);
    };
    ref.current = requestAnimationFrame(animate);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [value]);

  return <span className="font-display font-bold text-3xl text-foreground">{display}</span>;
};

const PassingGradeCard = ({ userId, classId }: Props) => {
  const [score, setScore] = useState<number | null>(null);
  const [passingGrade, setPassingGrade] = useState(75);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [breakdown, setBreakdown] = useState({ quiz: 0, assessment: 0, manual: 0, attendance: 0 });

  useEffect(() => {
    const load = async () => {
      // Get config
      const { data: cfg } = await supabase.from("grading_config").select("*").eq("class_id", classId).maybeSingle();
      if (!cfg) { setLoading(false); return; }

      setConfig(cfg);
      setPassingGrade(Number(cfg.passing_grade));

      // Fetch all data in parallel
      const [quizRes, assessRes, manualRes, attRes, attTotalRes] = await Promise.all([
        supabase.from("quiz_submissions").select("score").eq("student_id", userId).eq("status", "graded").not("score", "is", null),
        supabase.from("assessment_submissions").select("score").eq("student_id", userId).eq("status", "completed").not("score", "is", null),
        supabase.from("manual_grades").select("score, max_score").eq("student_id", userId),
        supabase.from("attendance").select("id").eq("student_id", userId).eq("status", "present"),
        supabase.from("attendance").select("id").eq("student_id", userId),
      ]);

      // Quiz avg (0-100)
      const quizScores = (quizRes.data || []).map(s => Number(s.score));
      const quizAvg = quizScores.length > 0 ? quizScores.reduce((a, b) => a + b, 0) / quizScores.length : 0;

      // Assessment avg (0-100)
      const assessScores = (assessRes.data || []).map(s => Number(s.score));
      const assessAvg = assessScores.length > 0 ? assessScores.reduce((a, b) => a + b, 0) / assessScores.length : 0;

      // Manual avg (normalized to 0-100)
      const manualScores = (manualRes.data || []).map(g => (Number(g.score) / Number(g.max_score)) * 100);
      const manualAvg = manualScores.length > 0 ? manualScores.reduce((a, b) => a + b, 0) / manualScores.length : 0;

      // Attendance rate (0-100)
      const presentCount = (attRes.data || []).length;
      const totalCount = (attTotalRes.data || []).length;
      const attendanceRate = totalCount > 0 ? (presentCount / totalCount) * 100 : 0;

      const qw = Number(cfg.quiz_weight) / 100;
      const aw = Number(cfg.assessment_weight) / 100;
      const mw = Number(cfg.manual_weight) / 100;
      const tw = Number(cfg.attendance_weight) / 100;

      const finalScore = (quizAvg * qw) + (assessAvg * aw) + (manualAvg * mw) + (attendanceRate * tw);

      setBreakdown({ quiz: Math.round(quizAvg * qw * 10) / 10, assessment: Math.round(assessAvg * aw * 10) / 10, manual: Math.round(manualAvg * mw * 10) / 10, attendance: Math.round(attendanceRate * tw * 10) / 10 });
      setScore(Math.round(finalScore * 10) / 10);
      setLoading(false);
    };
    load();
  }, [userId, classId]);

  if (loading) return <div className="glass rounded-2xl p-6 animate-pulse h-48" />;
  if (!config) return null; // No config set, don't show

  const diff = (score ?? 0) - passingGrade;
  const isPassing = diff >= 0;

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Trophy className="w-5 h-5 text-primary" />
        <span className="font-display font-bold text-sm">My Final Score</span>
        {isPassing && <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />}
      </div>

      <div className="flex items-center gap-6">
        <CircularProgress value={score ?? 0} passingGrade={passingGrade} />
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {isPassing ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-destructive" />
            )}
            <span className={`text-sm font-bold ${isPassing ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
              {isPassing ? `🎉 Above by ${Math.round(diff)} pts!` : `📈 Need ${Math.round(Math.abs(diff))} more pts`}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">Passing grade: {passingGrade}</p>

          {/* Mini breakdown */}
          <div className="space-y-1 pt-1">
            {[
              { label: "Quiz", value: breakdown.quiz, weight: config.quiz_weight },
              { label: "Assessment", value: breakdown.assessment, weight: config.assessment_weight },
              { label: "Manual", value: breakdown.manual, weight: config.manual_weight },
              { label: "Attendance", value: breakdown.attendance, weight: config.attendance_weight },
            ].filter(b => Number(b.weight) > 0).map((b) => (
              <div key={b.label} className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">{b.label} ({b.weight}%)</span>
                <span className="font-bold">{b.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PassingGradeCard;
