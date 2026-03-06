import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Sparkles, Trash2, ChevronLeft, ChevronRight, Users } from "lucide-react";
import {
  TKA_FRAMEWORK, TkaBasketItem, TkaOutlineItem, BentukSoal, JenisTeks,
} from "@/constants/tkaFramework";

type QuestionDraft = {
  question_text: string;
  options: string[] | null;
  correct_answer: string;
  difficulty: string;
  cognitive_level: string;
  jenis_teks?: string;
  order_index: number;
};

type TkaBuilderProps = {
  classes: { id: string; class_name: string }[];
  onSaved: () => void;
};

const TkaBuilder = ({ classes, onSaved }: TkaBuilderProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);

  // Step 1: Basic info
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [tingkat, setTingkat] = useState<"B1" | "A2">("B1");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [description, setDescription] = useState("");

  // Multi-class assignment
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);

  // Student assignment
  const [showStudentAssign, setShowStudentAssign] = useState(false);
  const [students, setStudents] = useState<{ id: string; full_name: string; class_id: string | null }[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<{ id: string; purpose: string }[]>([]);

  // Step 2: Basket - now includes jenis_teks per item
  const [basket, setBasket] = useState<TkaBasketItem[]>([]);
  const [formJenisTeks, setFormJenisTeks] = useState<JenisTeks>("narrative");
  const [formBentuk, setFormBentuk] = useState<BentukSoal>("pg");
  const [formNumOptions, setFormNumOptions] = useState<4 | 5>(5);
  const [formNumQuestions, setFormNumQuestions] = useState(5);
  const [formKompetensi, setFormKompetensi] = useState<string>(TKA_FRAMEWORK.kompetensi[0].name);
  const [formSubkompetensi, setFormSubkompetensi] = useState<string[]>([]);
  const [formIncludePassage, setFormIncludePassage] = useState(true);

  // Step 3: Outline
  const [outline, setOutline] = useState<(TkaOutlineItem & { jenis_teks?: string })[]>([]);
  const [outlineGenerated, setOutlineGenerated] = useState(false);
  const [generatingOutline, setGeneratingOutline] = useState(false);

  // Step 4: Generated questions
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [passagesByGenre, setPassagesByGenre] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const selectedKompetensi = TKA_FRAMEWORK.kompetensi.find(k => k.name === formKompetensi);
  const totalQuestions = basket.reduce((sum, b) => sum + b.num_questions, 0);

  // Load students when classes are selected
  useEffect(() => {
    if (selectedClassIds.length === 0) {
      setStudents([]);
      return;
    }
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, class_id")
        .in("class_id", selectedClassIds);
      setStudents(data || []);
    };
    load();
  }, [selectedClassIds]);

  const toggleClass = (classId: string) => {
    setSelectedClassIds(prev =>
      prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]
    );
  };

  const toggleStudent = (studentId: string, purpose: string = "remedial") => {
    setSelectedStudents(prev => {
      const exists = prev.find(s => s.id === studentId);
      if (exists) return prev.filter(s => s.id !== studentId);
      return [...prev, { id: studentId, purpose }];
    });
  };

  const updateStudentPurpose = (studentId: string, purpose: string) => {
    setSelectedStudents(prev =>
      prev.map(s => s.id === studentId ? { ...s, purpose } : s)
    );
  };

  const addToBasket = () => {
    if (formSubkompetensi.length === 0) {
      toast({ title: "Pilih minimal 1 subkompetensi", variant: "destructive" });
      return;
    }
    if (formNumQuestions < 1) {
      toast({ title: "Jumlah soal minimal 1", variant: "destructive" });
      return;
    }
    setBasket(prev => [...prev, {
      id: crypto.randomUUID(),
      jenis_teks: formJenisTeks,
      bentuk_soal: formBentuk,
      num_options: formNumOptions,
      num_questions: formNumQuestions,
      kompetensi: formKompetensi,
      subkompetensi: [...formSubkompetensi],
      include_passage: formIncludePassage,
    }]);
    setFormSubkompetensi([]);
    setFormNumQuestions(5);
  };

  const removeFromBasket = (id: string) => {
    setBasket(prev => prev.filter(b => b.id !== id));
  };

  const handleGenerateOutline = async () => {
    if (basket.length === 0) {
      toast({ title: "Tambahkan bentuk soal ke keranjang dulu", variant: "destructive" });
      return;
    }
    setGeneratingOutline(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-assessment", {
        body: {
          mode: "tka",
          generate_outline: true,
          tingkat,
          topic: topic || title,
          basket_items: basket.map(b => ({
            jenis_teks: b.jenis_teks,
            bentuk_soal: b.bentuk_soal,
            num_options: b.num_options,
            num_questions: b.num_questions,
            kompetensi: b.kompetensi,
            subkompetensi: b.subkompetensi,
          })),
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.outline) {
        setOutline(data.outline);
        setOutlineGenerated(true);
        toast({ title: `Outline ${data.outline.length} soal berhasil dibuat` });
      }
    } catch (e: any) {
      toast({ title: "Gagal generate outline", description: e.message, variant: "destructive" });
    }
    setGeneratingOutline(false);
  };

  const handleGenerateQuestions = async () => {
    setGeneratingQuestions(true);
    const needsPassage = basket.some(b => b.include_passage);
    try {
      const { data, error } = await supabase.functions.invoke("generate-assessment", {
        body: {
          mode: "tka",
          generate_outline: false,
          tingkat,
          topic: topic || title,
          outline,
          generate_passage: needsPassage,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.passages_by_genre) {
        setPassagesByGenre(data.passages_by_genre);
      }
      if (data?.questions) {
        setQuestions(data.questions.map((q: any, i: number) => ({
          question_text: q.question_text,
          options: q.options || null,
          correct_answer: typeof q.correct_answer === "object" ? JSON.stringify(q.correct_answer) : (q.correct_answer || ""),
          difficulty: q.difficulty || "medium",
          cognitive_level: q.cognitive_level || q.kompetensi || "Pemahaman Tekstual",
          jenis_teks: q.jenis_teks || "",
          order_index: i,
        })));
        setStep(4);
        toast({ title: `${data.questions.length} soal berhasil di-generate` });
      }
    } catch (e: any) {
      toast({ title: "Gagal generate soal", description: e.message, variant: "destructive" });
    }
    setGeneratingQuestions(false);
  };

  const handleSave = async (activate: boolean) => {
    if (!title.trim() || selectedClassIds.length === 0) {
      toast({ title: "Title dan minimal 1 kelas wajib diisi", variant: "destructive" });
      return;
    }
    if (questions.length === 0) {
      toast({ title: "Generate soal dulu sebelum menyimpan", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      // Create assessment (class_id = first selected class for backward compat)
      const { data: assessment } = await supabase.from("assessments").insert({
        title,
        description: description || null,
        class_id: selectedClassIds[0],
        duration_minutes: parseInt(durationMinutes) || 60,
        is_active: activate,
        assessment_type: "tka",
      } as any).select().single();

      if (!assessment) throw new Error("Failed to create assessment");

      // Insert class assignments
      const classAssignments = selectedClassIds.map(cid => ({
        assessment_id: assessment.id,
        class_id: cid,
      }));
      await supabase.from("assessment_class_assignments").insert(classAssignments);

      // Insert student assignments if any
      if (selectedStudents.length > 0) {
        const studentAssignments = selectedStudents.map(s => ({
          assessment_id: assessment.id,
          student_id: s.id,
          purpose: s.purpose,
        }));
        await supabase.from("assessment_student_assignments").insert(studentAssignments);
      }

      // Group questions by jenis_teks for sections
      const genreGroups: Record<string, QuestionDraft[]> = {};
      for (const q of questions) {
        const genre = q.jenis_teks || "general";
        if (!genreGroups[genre]) genreGroups[genre] = [];
        genreGroups[genre].push(q);
      }

      let sectionOrder = 0;
      for (const [genre, genreQuestions] of Object.entries(genreGroups)) {
        const { data: section } = await supabase.from("assessment_sections").insert({
          assessment_id: assessment.id,
          title: `TKA - ${genre.charAt(0).toUpperCase() + genre.slice(1)}`,
          question_type: "multiple_choice",
          num_questions: genreQuestions.length,
          reading_passage: passagesByGenre[genre] || null,
          order_index: sectionOrder++,
        }).select().single();

        if (!section) continue;

        const questionRows = genreQuestions.map((q, i) => ({
          section_id: section.id,
          assessment_id: assessment.id,
          question_text: q.question_text,
          options: q.options,
          correct_answer: q.correct_answer || null,
          difficulty: q.difficulty,
          cognitive_level: q.cognitive_level,
          order_index: i,
        }));

        await supabase.from("assessment_questions").insert(questionRows);
      }

      toast({ title: "Assessment TKA berhasil disimpan!" });
      onSaved();
    } catch (e: any) {
      toast({ title: "Gagal menyimpan", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const updateOutlineItem = (index: number, field: string, value: string) => {
    setOutline(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const getBentukLabel = (value: string) => {
    return TKA_FRAMEWORK.bentuk_soal.find(b => b.value === value)?.label || value;
  };

  const classMap = Object.fromEntries(classes.map(c => [c.id, c.class_name]));

  return (
    <div className="space-y-4">
      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-2">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Step {step} of 4: {step === 1 ? "Info Dasar" : step === 2 ? "Keranjang Soal" : step === 3 ? "Review Outline" : "Review & Simpan"}
      </p>

      {step === 1 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Judul Assessment</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. TKA Bahasa Inggris - Paket 1" />
          </div>
          <div className="space-y-2">
            <Label>Topik / Tema</Label>
            <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Daily Life, School Activities, Environment" />
            <p className="text-[10px] text-muted-foreground">Topik umum untuk semua teks. Jenis teks dipilih per soal di keranjang.</p>
          </div>
          <div className="space-y-2">
            <Label>Tingkat Kemahiran</Label>
            <div className="flex gap-2">
              {(["B1", "A2"] as const).map(t => (
                <button key={t} onClick={() => setTingkat(t)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                    tingkat === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                  {t} — {TKA_FRAMEWORK.tingkat_kemahiran[t].label}
                </button>
              ))}
            </div>
          </div>

          {/* Multi-class selection */}
          <div className="space-y-2">
            <Label>Kelas (pilih 1 atau lebih)</Label>
            <div className="space-y-1.5 max-h-32 overflow-y-auto rounded-lg border border-border p-2">
              {classes.map(c => (
                <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={selectedClassIds.includes(c.id)}
                    onCheckedChange={() => toggleClass(c.id)}
                  />
                  <span>{c.class_name}</span>
                </label>
              ))}
              {classes.length === 0 && <p className="text-xs text-muted-foreground italic">Belum ada kelas</p>}
            </div>
          </div>

          {/* Student assignment */}
          <div className="space-y-2">
            <button
              onClick={() => setShowStudentAssign(!showStudentAssign)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Users className="w-4 h-4" />
              <span>Assign ke murid tertentu (opsional)</span>
            </button>
            {showStudentAssign && (
              <div className="rounded-lg border border-border p-3 space-y-2">
                {selectedClassIds.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Pilih kelas dulu</p>
                ) : students.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Tidak ada murid di kelas terpilih</p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {students.map(s => {
                      const selected = selectedStudents.find(ss => ss.id === s.id);
                      return (
                        <div key={s.id} className="flex items-center gap-2 text-xs">
                          <Checkbox
                            checked={!!selected}
                            onCheckedChange={() => toggleStudent(s.id)}
                          />
                          <span className="flex-1 truncate">{s.full_name || "Unnamed"}</span>
                          <Badge variant="outline" className="text-[9px]">{classMap[s.class_id || ""] || ""}</Badge>
                          {selected && (
                            <Select value={selected.purpose} onValueChange={v => updateStudentPurpose(s.id, v)}>
                              <SelectTrigger className="h-6 w-24 text-[10px]"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="remedial">Remedial</SelectItem>
                                <SelectItem value="pengayaan">Pengayaan</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Durasi (menit)</Label>
              <Input type="number" value={durationMinutes} onChange={e => setDurationMinutes(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi (opsional)</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Deskripsi singkat" />
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          {/* Add form */}
          <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-3">
            <Label className="font-semibold text-sm">Tambah Bentuk Soal</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Jenis Teks</Label>
                <Select value={formJenisTeks} onValueChange={v => setFormJenisTeks(v as JenisTeks)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TKA_FRAMEWORK.jenis_teks.map(t => (
                      <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Bentuk Soal</Label>
                <Select value={formBentuk} onValueChange={v => setFormBentuk(v as BentukSoal)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TKA_FRAMEWORK.bentuk_soal.map(b => (
                      <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Jumlah Opsi</Label>
                <div className="flex gap-2 pt-0.5">
                  {([4, 5] as const).map(n => (
                    <button key={n} onClick={() => setFormNumOptions(n)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                        formNumOptions === n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Jumlah Soal</Label>
                <Input type="number" min={1} value={formNumQuestions} onChange={e => setFormNumQuestions(parseInt(e.target.value) || 1)} className="h-8 text-xs" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Kompetensi</Label>
                <Select value={formKompetensi} onValueChange={v => { setFormKompetensi(v); setFormSubkompetensi([]); }}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TKA_FRAMEWORK.kompetensi.map(k => (
                      <SelectItem key={k.name} value={k.name}>{k.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Subkompetensi checkboxes */}
            {selectedKompetensi && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Subkompetensi</Label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {selectedKompetensi.subkompetensi.map((sub, i) => (
                    <label key={i} className="flex items-start gap-2 text-xs cursor-pointer">
                      <Checkbox
                        checked={formSubkompetensi.includes(sub)}
                        onCheckedChange={(checked) => {
                          setFormSubkompetensi(prev =>
                            checked ? [...prev, sub] : prev.filter(s => s !== sub)
                          );
                        }}
                        className="mt-0.5"
                      />
                      <span className="leading-tight">{sub}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Checkbox checked={formIncludePassage} onCheckedChange={c => setFormIncludePassage(!!c)} />
              <Label className="text-xs">Include Reading Passage</Label>
            </div>

            <Button size="sm" className="rounded-xl gap-1 w-full" onClick={addToBasket}>
              <Plus className="w-3 h-3" /> Tambah ke Keranjang
            </Button>
          </div>

          {/* Basket */}
          <div className="space-y-2">
            <Label className="font-semibold text-sm">Keranjang Soal</Label>
            {basket.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Belum ada — tambahkan bentuk soal di atas</p>
            ) : (
              <div className="space-y-1.5">
                {basket.map(b => (
                  <div key={b.id} className="flex items-center gap-2 p-2 rounded-lg bg-background border border-border/50 text-xs">
                    <div className="flex-1 min-w-0">
                      <Badge variant="secondary" className="text-[9px] capitalize mr-1">{b.jenis_teks}</Badge>
                      <span className="font-semibold">{getBentukLabel(b.bentuk_soal)}</span>
                      <span className="text-muted-foreground"> ({b.num_options} opsi)</span>
                      <span className="mx-1">·</span>
                      <span className="font-bold">{b.num_questions} soal</span>
                      <span className="mx-1">·</span>
                      <span className="text-muted-foreground">{b.kompetensi}</span>
                      {b.include_passage && <Badge variant="outline" className="text-[9px] ml-1">+ Passage</Badge>}
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeFromBasket(b.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="text-right text-sm font-bold">
              Total: {totalQuestions} soal
              {basket.length > 0 && (
                <span className="text-xs text-muted-foreground font-normal ml-2">
                  ({[...new Set(basket.map(b => b.jenis_teks))].join(", ")})
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          {!outlineGenerated ? (
            <div className="text-center space-y-3 py-4">
              <p className="text-sm text-muted-foreground">Generate outline soal berdasarkan keranjang. Anda bisa mengedit outline sebelum generate soal.</p>
              <Button onClick={handleGenerateOutline} disabled={generatingOutline} className="gap-2 rounded-xl">
                {generatingOutline ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Generate Outline
              </Button>
            </div>
          ) : (
            <>
              <div className="text-sm text-muted-foreground">
                Total: <span className="font-bold text-foreground">{outline.length}</span> soal — edit deskripsi lalu klik Approve & Generate
              </div>
              <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                {outline.map((item, i) => (
                  <div key={i} className="rounded-lg border border-border p-3 bg-muted/20 space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-muted-foreground w-6 shrink-0">#{item.no}</span>
                      <Badge variant="secondary" className="text-[9px] capitalize">{(item as any).jenis_teks || ""}</Badge>
                      <Badge variant="outline" className="text-[9px]">{getBentukLabel(item.bentuk_soal)}</Badge>
                      <Badge variant="secondary" className="text-[9px]">{item.kompetensi}</Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground italic">{item.subkompetensi}</p>
                    <Textarea
                      value={item.deskripsi_soal}
                      onChange={e => updateOutlineItem(i, "deskripsi_soal", e.target.value)}
                      rows={2}
                      className="text-xs"
                      placeholder="Question description..."
                    />
                  </div>
                ))}
              </div>
              <Button onClick={handleGenerateQuestions} disabled={generatingQuestions} className="w-full gap-2 rounded-xl">
                {generatingQuestions ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Approve & Generate Soal
              </Button>
            </>
          )}
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Total: <span className="font-bold text-foreground">{questions.length}</span> soal · Durasi: <span className="font-bold text-foreground">{durationMinutes} min</span>
          </div>

          {/* Passages by genre */}
          {Object.entries(passagesByGenre).map(([genre, text]) => (
            <div key={genre} className="rounded-xl border border-border p-3 bg-muted/20 space-y-2">
              <Label className="text-xs font-semibold capitalize">Reading Passage — {genre}</Label>
              <Textarea value={text} onChange={e => setPassagesByGenre(prev => ({ ...prev, [genre]: e.target.value }))} rows={4} className="text-xs" />
            </div>
          ))}

          <div className="space-y-1.5 max-h-[40vh] overflow-y-auto">
            {questions.map((q, i) => (
              <div key={i} className="text-xs p-2 rounded-lg bg-background border border-border/50 flex items-start gap-2">
                <span className="font-bold text-muted-foreground shrink-0">{i + 1}.</span>
                <div className="flex-1 min-w-0">
                  <p className="line-clamp-2">{q.question_text}</p>
                  {q.options && (
                    <div className="mt-1 space-y-0.5 text-muted-foreground">
                      {q.options.map((opt, oi) => (
                        <p key={oi} className={opt === q.correct_answer ? "text-green-600 font-semibold" : ""}>
                          {String.fromCharCode(65 + oi)}. {opt}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1 items-end shrink-0">
                  {q.jenis_teks && <Badge variant="secondary" className="text-[9px] capitalize">{q.jenis_teks}</Badge>}
                  <Badge variant="outline" className="text-[9px]">{q.cognitive_level}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 pt-2 border-t">
        {step > 1 && (
          <Button variant="outline" onClick={() => setStep(step - 1)} className="gap-1">
            <ChevronLeft className="w-4 h-4" /> Kembali
          </Button>
        )}
        <div className="flex-1" />
        {step === 1 && (
          <Button onClick={() => {
            if (!title.trim() || selectedClassIds.length === 0) {
              toast({ title: "Title dan minimal 1 kelas wajib diisi", variant: "destructive" });
              return;
            }
            setStep(2);
          }} className="gap-1">
            Lanjut <ChevronRight className="w-4 h-4" />
          </Button>
        )}
        {step === 2 && (
          <Button onClick={() => {
            if (basket.length === 0) {
              toast({ title: "Tambahkan minimal 1 bentuk soal", variant: "destructive" });
              return;
            }
            setStep(3);
          }} className="gap-1">
            Lanjut <ChevronRight className="w-4 h-4" />
          </Button>
        )}
        {step === 4 && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />} Save as Draft
            </Button>
            <Button onClick={() => handleSave(true)} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />} Save & Activate
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TkaBuilder;
