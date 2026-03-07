import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Save, Target, BarChart3 } from "lucide-react";

type GradingConfig = {
  id?: string;
  class_id: string;
  passing_grade: number;
  quiz_weight: number;
  assessment_weight: number;
  manual_weight: number;
  attendance_weight: number;
};

const DEFAULT_CONFIG: Omit<GradingConfig, "class_id"> = {
  passing_grade: 75,
  quiz_weight: 25,
  assessment_weight: 25,
  manual_weight: 25,
  attendance_weight: 25,
};

const AdminGradingConfig = () => {
  const { toast } = useToast();
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [config, setConfig] = useState<GradingConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from("classes").select("id, class_name").eq("is_archived", false).order("class_name").then(({ data }) => {
      setClasses(data || []);
    });
  }, []);

  useEffect(() => {
    if (!selectedClass) { setConfig(null); return; }
    setLoading(true);
    supabase.from("grading_config").select("*").eq("class_id", selectedClass).maybeSingle().then(({ data }) => {
      setConfig(data ? data as GradingConfig : { class_id: selectedClass, ...DEFAULT_CONFIG });
      setLoading(false);
    });
  }, [selectedClass]);

  const totalWeight = config ? config.quiz_weight + config.assessment_weight + config.manual_weight + config.attendance_weight : 0;
  const isValid = totalWeight === 100;

  const updateWeight = (key: keyof GradingConfig, value: number) => {
    if (!config) return;
    setConfig({ ...config, [key]: value });
  };

  const handleSave = async () => {
    if (!config || !isValid) return;
    setSaving(true);
    const payload = {
      class_id: config.class_id,
      passing_grade: config.passing_grade,
      quiz_weight: config.quiz_weight,
      assessment_weight: config.assessment_weight,
      manual_weight: config.manual_weight,
      attendance_weight: config.attendance_weight,
      updated_at: new Date().toISOString(),
    };

    const { error } = config.id
      ? await supabase.from("grading_config").update(payload).eq("id", config.id)
      : await supabase.from("grading_config").insert(payload);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved!", description: "Grading configuration updated." });
      // Re-fetch to get id
      const { data } = await supabase.from("grading_config").select("*").eq("class_id", selectedClass).maybeSingle();
      if (data) setConfig(data as GradingConfig);
    }
    setSaving(false);
  };

  const weights = config ? [
    { label: "Quiz", key: "quiz_weight" as const, color: "bg-primary" },
    { label: "Assessment", key: "assessment_weight" as const, color: "bg-chart-2" },
    { label: "Manual Grades", key: "manual_weight" as const, color: "bg-chart-3" },
    { label: "Attendance", key: "attendance_weight" as const, color: "bg-chart-4" },
  ] : [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="font-display font-bold text-2xl flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" /> Passing Grade Config
          </h2>
          <p className="text-muted-foreground mt-1">Set passing grade and component weights per class</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select Class</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger><SelectValue placeholder="Choose a class..." /></SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.class_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {loading && <div className="text-center py-8 text-muted-foreground animate-pulse">Loading...</div>}

        {config && !loading && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-4 h-4" /> Passing Grade Threshold
                </CardTitle>
                <CardDescription>Minimum score students must reach (0-100)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-4">
                  <Slider
                    value={[config.passing_grade]}
                    onValueChange={([v]) => updateWeight("passing_grade", v)}
                    min={0} max={100} step={1}
                    className="flex-1"
                  />
                  <Input
                    type="number" min={0} max={100}
                    value={config.passing_grade}
                    onChange={(e) => updateWeight("passing_grade", Number(e.target.value))}
                    className="w-20 text-center font-bold"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" /> Component Weights
                </CardTitle>
                <CardDescription>
                  Must total 100%. Currently: <span className={`font-bold ${isValid ? "text-green-600" : "text-destructive"}`}>{totalWeight}%</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {weights.map((w) => (
                  <div key={w.key} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-bold">{w.label}</Label>
                      <span className="text-sm font-bold text-primary">{config[w.key]}%</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[config[w.key] as number]}
                        onValueChange={([v]) => updateWeight(w.key, v)}
                        min={0} max={100} step={5}
                        className="flex-1"
                      />
                      <Input
                        type="number" min={0} max={100}
                        value={config[w.key]}
                        onChange={(e) => updateWeight(w.key, Number(e.target.value))}
                        className="w-20 text-center font-bold"
                      />
                    </div>
                  </div>
                ))}

                {/* Visual bar preview */}
                <div className="mt-4 space-y-2">
                  <Label className="text-xs text-muted-foreground">Weight Distribution</Label>
                  <div className="h-6 rounded-full overflow-hidden flex">
                    {weights.map((w) => {
                      const val = config[w.key] as number;
                      if (val === 0) return null;
                      return (
                        <div
                          key={w.key}
                          className={`${w.color} flex items-center justify-center text-[10px] font-bold text-primary-foreground transition-all`}
                          style={{ width: `${val}%` }}
                        >
                          {val >= 10 && `${val}%`}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    {weights.map((w) => (
                      <div key={w.key} className="flex items-center gap-1.5">
                        <div className={`w-2.5 h-2.5 rounded-full ${w.color}`} />
                        <span className="text-[10px] text-muted-foreground">{w.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {!isValid && (
                  <p className="text-sm text-destructive font-medium">
                    ⚠️ Weights must total 100% (currently {totalWeight}%)
                  </p>
                )}
              </CardContent>
            </Card>

            <Button onClick={handleSave} disabled={!isValid || saving} className="w-full rounded-xl h-12 font-bold">
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Configuration"}
            </Button>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminGradingConfig;
