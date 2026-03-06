import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import {
  FileCheck, Plus, Trash2, Edit, Loader2, Sparkles, ChevronRight, ChevronLeft, Users,
} from "lucide-react";
import ApiKeyManager from "@/components/admin/ApiKeyManager";
import TkaBuilder from "@/components/admin/TkaBuilder";

type SectionDraft = {
  id?: string;
  title: string;
  question_type: string;
  num_questions: number;
  reading_passage: string;
  difficulty_easy: number;
  difficulty_medium: number;
  difficulty_hard: number;
  cognitive_levels: string[];
  order_index: number;
};

type QuestionDraft = {
  id?: string;
  section_id?: string;
  question_text: string;
  options: string[] | null;
  correct_answer: string;
  difficulty: string;
  cognitive_level: string;
  order_index: number;
};

type Assessment = {
  id: string;
  title: string;
  description: string | null;
  class_id: string;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
  section_count?: number;
  question_count?: number;
  assessment_type?: string;
};

const QUESTION_TYPES = [
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "mcma", label: "Multiple Choice (Multiple Answer)" },
  { value: "true_false", label: "True / False" },
  { value: "true_false_statement", label: "True / False (Statement Table)" },
  { value: "short_answer", label: "Short Answer" },
  { value: "essay", label: "Essay" },
];

const COGNITIVE_LEVELS = ["C1", "C2", "C3", "C4", "C5", "C6"];

const emptySectionDraft = (index: number): SectionDraft => ({
  title: `Part ${index + 1}`,
  question_type: "multiple_choice",
  num_questions: 5,
  reading_passage: "",
  difficulty_easy: 2,
  difficulty_medium: 2,
  difficulty_hard: 1,
  cognitive_levels: ["C2", "C3"],
  order_index: index,
});

const AdminAssessments = () => {
  const { toast } = useToast();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("formative");

  // TKA dialog
  const [tkaDialogOpen, setTkaDialogOpen] = useState(false);

  // Step management
  const [step, setStep] = useState(1);

  // Step 1 fields
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [scheduledAt, setScheduledAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  // Multi-class assignment for formative
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [showStudentAssign, setShowStudentAssign] = useState(false);
  const [formStudents, setFormStudents] = useState<{ id: string; full_name: string; class_id: string | null }[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<{ id: string; purpose: string }[]>([]);

  // Step 2 fields
  const [generatingPassage, setGeneratingPassage] = useState(false);
  const [sections, setSections] = useState<SectionDraft[]>([emptySectionDraft(0)]);
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);

  // Step 3 fields
  const [sectionQuestions, setSectionQuestions] = useState<Record<number, QuestionDraft[]>>({});
  const [generatingSection, setGeneratingSection] = useState<number | null>(null);

  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data } = await supabase.from("classes").select("id, class_name").order("class_name");
      return data || [];
    },
  });

  const classMap = Object.fromEntries(classes.map((c) => [c.id, c.class_name]));

  // Load students when formative classes change
  useEffect(() => {
    if (selectedClassIds.length === 0) {
      setFormStudents([]);
      return;
    }
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, class_id")
        .in("class_id", selectedClassIds);
      setFormStudents(data || []);
    };
    load();
  }, [selectedClassIds]);

  const toggleFormClass = (classId: string) => {
    setSelectedClassIds(prev =>
      prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]
    );
  };

  const toggleFormStudent = (studentId: string) => {
    setSelectedStudents(prev => {
      const exists = prev.find(s => s.id === studentId);
      if (exists) return prev.filter(s => s.id !== studentId);
      return [...prev, { id: studentId, purpose: "remedial" }];
    });
  };

  const updateFormStudentPurpose = (studentId: string, purpose: string) => {
    setSelectedStudents(prev =>
      prev.map(s => s.id === studentId ? { ...s, purpose } : s)
    );
  };

  const fetchAssessments = async () => {
    const { data } = await supabase.from("assessments").select("*").order("created_at", { ascending: false });
    if (data) {
      const ids = data.map((a) => a.id);
      const { data: secs } = await supabase.from("assessment_sections").select("assessment_id").in("assessment_id", ids);
      const { data: qs } = await supabase.from("assessment_questions").select("assessment_id").in("assessment_id", ids);
      const secMap: Record<string, number> = {};
      const qMap: Record<string, number> = {};
      secs?.forEach((s) => { secMap[s.assessment_id] = (secMap[s.assessment_id] || 0) + 1; });
      qs?.forEach((q) => { qMap[q.assessment_id] = (qMap[q.assessment_id] || 0) + 1; });
      setAssessments(data.map((a: any) => ({ ...a, section_count: secMap[a.id] || 0, question_count: qMap[a.id] || 0 })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchAssessments(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setTitle(""); setTopic(""); setDescription(""); setSelectedClassIds([]); setDurationMinutes("60");
    setScheduledAt(""); setExpiresAt("");
    setSelectedStudents([]); setShowStudentAssign(false);
    setSections([emptySectionDraft(0)]);
    setCurrentSectionIdx(0);
    setSectionQuestions({});
    setStep(1);
    setDialogOpen(true);
  };

  const openEdit = async (assessment: Assessment) => {
    setEditingId(assessment.id);
    setTitle(assessment.title);
    setDescription(assessment.description || "");
    setSelectedClassIds(assessment.class_id ? [assessment.class_id] : []);
    setDurationMinutes(assessment.duration_minutes.toString());
    setScheduledAt((assessment as any).scheduled_at ? new Date((assessment as any).scheduled_at).toISOString().slice(0, 16) : "");
    setExpiresAt((assessment as any).expires_at ? new Date((assessment as any).expires_at).toISOString().slice(0, 16) : "");
    setSelectedStudents([]);
    setShowStudentAssign(false);

    // Load class assignments
    const { data: classAssigns } = await supabase
      .from("assessment_class_assignments")
      .select("class_id")
      .eq("assessment_id", assessment.id);
    if (classAssigns && classAssigns.length > 0) {
      setSelectedClassIds(classAssigns.map(ca => ca.class_id));
    }

    // Load student assignments
    const { data: studentAssigns } = await supabase
      .from("assessment_student_assignments")
      .select("student_id, purpose")
      .eq("assessment_id", assessment.id);
    if (studentAssigns && studentAssigns.length > 0) {
      setSelectedStudents(studentAssigns.map(sa => ({ id: sa.student_id, purpose: sa.purpose })));
      setShowStudentAssign(true);
    }

    const { data: secs } = await supabase.from("assessment_sections").select("*").eq("assessment_id", assessment.id).order("order_index");
    const loadedSections: SectionDraft[] = (secs || []).map((s, i) => ({
      id: s.id,
      title: s.title,
      question_type: s.question_type,
      num_questions: s.num_questions,
      reading_passage: s.reading_passage || "",
      difficulty_easy: s.difficulty_easy,
      difficulty_medium: s.difficulty_medium,
      difficulty_hard: s.difficulty_hard,
      cognitive_levels: (s.cognitive_levels as string[]) || [],
      order_index: i,
    }));
    setSections(loadedSections.length > 0 ? loadedSections : [emptySectionDraft(0)]);

    const { data: allQs } = await supabase.from("assessment_questions").select("*").eq("assessment_id", assessment.id).order("order_index");
    const qMap: Record<number, QuestionDraft[]> = {};
    loadedSections.forEach((sec, idx) => {
      qMap[idx] = (allQs || [])
        .filter((q) => q.section_id === sec.id)
        .map((q) => ({
          id: q.id,
          section_id: q.section_id,
          question_text: q.question_text,
          options: (q.options as string[]) || null,
          correct_answer: q.correct_answer || "",
          difficulty: q.difficulty,
          cognitive_level: q.cognitive_level,
          order_index: q.order_index,
        }));
    });
    setSectionQuestions(qMap);
    setCurrentSectionIdx(0);
    setStep(1);
    setDialogOpen(true);
  };

  const addSection = () => {
    const newSec = emptySectionDraft(sections.length);
    setSections((prev) => [...prev, newSec]);
    setCurrentSectionIdx(sections.length);
  };

  const removeSection = (idx: number) => {
    setSections((prev) => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order_index: i, title: s.title.startsWith("Part ") ? `Part ${i + 1}` : s.title })));
    setSectionQuestions((prev) => {
      const next = { ...prev };
      delete next[idx];
      const reindexed: Record<number, QuestionDraft[]> = {};
      Object.keys(next).forEach((k) => {
        const ki = parseInt(k);
        const ni = ki > idx ? ki - 1 : ki;
        reindexed[ni] = next[ki];
      });
      return reindexed;
    });
    if (currentSectionIdx >= sections.length - 1) setCurrentSectionIdx(Math.max(0, sections.length - 2));
  };

  const updateSection = (idx: number, field: keyof SectionDraft, value: any) => {
    setSections((prev) => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const toggleCognitive = (idx: number, level: string) => {
    setSections((prev) => prev.map((s, i) => {
      if (i !== idx) return s;
      const levels = s.cognitive_levels.includes(level)
        ? s.cognitive_levels.filter((l) => l !== level)
        : [...s.cognitive_levels, level];
      return { ...s, cognitive_levels: levels };
    }));
  };

  const handleGeneratePassage = async (sectionIdx: number) => {
    const topicText = topic.trim() || title.trim();
    if (!topicText) {
      toast({ title: "Please set a topic or title first", variant: "destructive" });
      return;
    }
    setGeneratingPassage(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-assessment", {
        body: { topic: topicText, generate_passage: true, question_type: sections[sectionIdx].question_type },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.reading_passage) {
        updateSection(sectionIdx, "reading_passage", data.reading_passage);
        toast({ title: "Reading passage generated!" });
      }
    } catch (e: any) {
      toast({ title: "Passage generation failed", description: e.message, variant: "destructive" });
    }
    setGeneratingPassage(false);
  };

  const handleAiGenerate = async (sectionIdx: number) => {
    const sec = sections[sectionIdx];
    const topicText = topic.trim() || title.trim();
    if (!topicText) {
      toast({ title: "Please set a topic or title first", variant: "destructive" });
      return;
    }
    setGeneratingSection(sectionIdx);
    try {
      const { data, error } = await supabase.functions.invoke("generate-assessment", {
        body: {
          topic: topicText,
          question_type: sec.question_type,
          num_questions: sec.num_questions,
          difficulty_distribution: { easy: sec.difficulty_easy, medium: sec.difficulty_medium, hard: sec.difficulty_hard },
          cognitive_levels: sec.cognitive_levels,
          reading_passage: sec.reading_passage || undefined,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.questions) {
        setSectionQuestions((prev) => ({
          ...prev,
          [sectionIdx]: data.questions.map((q: any, i: number) => ({
            question_text: q.question_text,
            options: q.options || null,
            correct_answer: q.correct_answer || "",
            difficulty: q.difficulty || "medium",
            cognitive_level: q.cognitive_level || "C1",
            order_index: i,
          })),
        }));
        toast({ title: `Generated ${data.questions.length} questions for ${sec.title}` });
      }
    } catch (e: any) {
      toast({ title: "AI generation failed", description: e.message, variant: "destructive" });
    }
    setGeneratingSection(null);
  };

  const handleSave = async (activate: boolean) => {
    if (!title.trim() || selectedClassIds.length === 0) {
      toast({ title: "Title and at least 1 class are required", variant: "destructive" });
      return;
    }
    const totalQuestions = Object.values(sectionQuestions).reduce((sum, qs) => sum + qs.length, 0);
    if (totalQuestions === 0) {
      toast({ title: "Generate or add questions before saving", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      let assessmentId = editingId;
      const payload: any = {
        title,
        description: description || null,
        class_id: selectedClassIds[0],
        duration_minutes: parseInt(durationMinutes) || 60,
        is_active: activate,
        assessment_type: "formative",
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      };

      if (editingId) {
        await supabase.from("assessment_questions").delete().eq("assessment_id", editingId);
        await supabase.from("assessment_sections").delete().eq("assessment_id", editingId);
        await supabase.from("assessment_class_assignments").delete().eq("assessment_id", editingId);
        await supabase.from("assessment_student_assignments").delete().eq("assessment_id", editingId);
        await supabase.from("assessments").update(payload).eq("id", editingId);
      } else {
        const { data } = await supabase.from("assessments").insert(payload).select().single();
        assessmentId = data!.id;
      }

      // Insert class assignments
      const classAssignments = selectedClassIds.map(cid => ({
        assessment_id: assessmentId!,
        class_id: cid,
      }));
      await supabase.from("assessment_class_assignments").insert(classAssignments);

      // Insert student assignments
      if (selectedStudents.length > 0) {
        const studentAssignments = selectedStudents.map(s => ({
          assessment_id: assessmentId!,
          student_id: s.id,
          purpose: s.purpose,
        }));
        await supabase.from("assessment_student_assignments").insert(studentAssignments);
      }

      const sectionRows = sections.map((s, i) => ({
        assessment_id: assessmentId!,
        title: s.title,
        question_type: s.question_type,
        num_questions: s.num_questions,
        reading_passage: s.reading_passage || null,
        difficulty_easy: s.difficulty_easy,
        difficulty_medium: s.difficulty_medium,
        difficulty_hard: s.difficulty_hard,
        cognitive_levels: s.cognitive_levels,
        order_index: i,
      }));
      const { data: insertedSections } = await supabase.from("assessment_sections").insert(sectionRows).select();

      if (insertedSections) {
        const allQuestionRows: any[] = [];
        insertedSections.forEach((sec, idx) => {
          const qs = sectionQuestions[idx] || [];
          qs.forEach((q, qi) => {
            allQuestionRows.push({
              section_id: sec.id,
              assessment_id: assessmentId!,
              question_text: q.question_text,
              options: q.options,
              correct_answer: q.correct_answer || null,
              difficulty: q.difficulty,
              cognitive_level: q.cognitive_level,
              order_index: qi,
            });
          });
        });
        if (allQuestionRows.length > 0) {
          await supabase.from("assessment_questions").insert(allQuestionRows);
        }
      }

      toast({ title: editingId ? "Assessment updated!" : "Assessment created!" });
      setDialogOpen(false);
      fetchAssessments();
    } catch (e: any) {
      toast({ title: "Error saving", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from("assessments").delete().eq("id", deleteId);
    setDeleteId(null);
    toast({ title: "Assessment deleted" });
    fetchAssessments();
  };

  const toggleActive = async (a: Assessment) => {
    await supabase.from("assessments").update({ is_active: !a.is_active }).eq("id", a.id);
    fetchAssessments();
  };

  const totalQuestionsInBuilder = Object.values(sectionQuestions).reduce((sum, qs) => sum + qs.length, 0);
  const currentSection = sections[currentSectionIdx];

  const filteredAssessments = assessments.filter(a => {
    const type = (a as any).assessment_type || "formative";
    return activeTab === "formative" ? type === "formative" : type === "tka";
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-display font-bold text-2xl">Assessments</h2>
            <p className="text-muted-foreground mt-1 text-sm">Create structured tests with AI-powered question generation</p>
          </div>
          <div className="flex items-center gap-2">
            <ApiKeyManager />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="formative" className="text-xs sm:text-sm">Formative</TabsTrigger>
              <TabsTrigger value="tka" className="text-xs sm:text-sm">TKA</TabsTrigger>
            </TabsList>
            {activeTab === "formative" ? (
              <Button onClick={openCreate} className="rounded-xl gap-2 w-full sm:w-auto"><Plus className="w-4 h-4" /> New Assessment</Button>
            ) : (
              <Button onClick={() => setTkaDialogOpen(true)} className="rounded-xl gap-2 w-full sm:w-auto"><Plus className="w-4 h-4" /> New TKA</Button>
            )}
          </div>

          <TabsContent value="formative">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : filteredAssessments.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center space-y-2">
                <FileCheck className="w-10 h-10 mx-auto text-muted-foreground/40" />
                <p className="text-muted-foreground font-medium">No formative assessments yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAssessments.map((a) => (
                  <div key={a.id} className="glass rounded-2xl p-4 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold truncate">{a.title}</h3>
                        <Badge variant={a.is_active ? "default" : "secondary"} className="text-[10px]">{a.is_active ? "Active" : "Draft"}</Badge>
                        {classMap[a.class_id] && <Badge variant="outline" className="text-[10px]">{classMap[a.class_id]}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{a.section_count} section{a.section_count !== 1 ? "s" : ""} · {a.question_count} question{a.question_count !== 1 ? "s" : ""} · {a.duration_minutes} min</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Switch checked={a.is_active} onCheckedChange={() => toggleActive(a)} />
                      <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => openEdit(a)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="rounded-xl text-destructive" onClick={() => setDeleteId(a.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="tka">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : filteredAssessments.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center space-y-2">
                <FileCheck className="w-10 h-10 mx-auto text-muted-foreground/40" />
                <p className="text-muted-foreground font-medium">No TKA assessments yet</p>
                <p className="text-xs text-muted-foreground">TKA = Tes Kemampuan Akademik Bahasa Inggris</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAssessments.map((a) => (
                  <div key={a.id} className="glass rounded-2xl p-4 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold truncate">{a.title}</h3>
                        <Badge variant={a.is_active ? "default" : "secondary"} className="text-[10px]">{a.is_active ? "Active" : "Draft"}</Badge>
                        <Badge variant="default" className="text-[10px]">TKA</Badge>
                        {classMap[a.class_id] && <Badge variant="outline" className="text-[10px]">{classMap[a.class_id]}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{a.question_count} question{a.question_count !== 1 ? "s" : ""} · {a.duration_minutes} min</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Switch checked={a.is_active} onCheckedChange={() => toggleActive(a)} />
                      <Button variant="ghost" size="icon" className="rounded-xl text-destructive" onClick={() => setDeleteId(a.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Formative Builder Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Assessment" : "Create Assessment"}</DialogTitle>
            <DialogDescription>
              Step {step} of 3: {step === 1 ? "Basic Info" : step === 2 ? "Add Sections" : "Structure & Generate"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 mb-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. English Mid-Term Test" /></div>
              <div className="space-y-2"><Label>Topic / Exam Material</Label><Textarea value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Present Perfect Tense - Reading Comprehension, Narrative Text, etc." rows={3} /><p className="text-[10px] text-muted-foreground">This topic will be used by AI to generate questions and reading passages</p></div>
              <div className="space-y-2"><Label>Description (optional)</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description" rows={2} /></div>

              {/* Multi-class selection */}
              <div className="space-y-2">
                <Label>Classes (select 1 or more)</Label>
                <div className="space-y-1.5 max-h-32 overflow-y-auto rounded-lg border border-border p-2">
                  {classes.map(c => (
                    <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={selectedClassIds.includes(c.id)}
                        onCheckedChange={() => toggleFormClass(c.id)}
                      />
                      <span>{c.class_name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Student assignment */}
              <div className="space-y-2">
                <button
                  onClick={() => setShowStudentAssign(!showStudentAssign)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Users className="w-4 h-4" />
                  <span>Assign to specific students (optional)</span>
                </button>
                {showStudentAssign && (
                  <div className="rounded-lg border border-border p-3 space-y-2">
                    {selectedClassIds.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">Select a class first</p>
                    ) : formStudents.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No students in selected classes</p>
                    ) : (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {formStudents.map(s => {
                          const selected = selectedStudents.find(ss => ss.id === s.id);
                          return (
                            <div key={s.id} className="flex items-center gap-2 text-xs">
                              <Checkbox
                                checked={!!selected}
                                onCheckedChange={() => toggleFormStudent(s.id)}
                              />
                              <span className="flex-1 truncate">{s.full_name || "Unnamed"}</span>
                              <Badge variant="outline" className="text-[9px]">{classMap[s.class_id || ""] || ""}</Badge>
                              {selected && (
                                <Select value={selected.purpose} onValueChange={v => updateFormStudentPurpose(s.id, v)}>
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

              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} placeholder="60" />
              </div>

              {/* Scheduling */}
              <div className="border-t border-border pt-3 space-y-3">
                <h4 className="font-semibold text-sm">📅 Scheduling</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Scheduled At (optional)</Label>
                    <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Expires At (optional)</Label>
                    <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="h-8 text-xs" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && currentSection && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                {sections.map((s, i) => (
                  <Button key={i} variant={i === currentSectionIdx ? "default" : "outline"} size="sm" className="rounded-xl text-xs" onClick={() => setCurrentSectionIdx(i)}>
                    {s.title}
                  </Button>
                ))}
                <Button variant="ghost" size="sm" onClick={addSection} className="rounded-xl text-xs gap-1"><Plus className="w-3 h-3" /> Add Section</Button>
              </div>

              <div className="space-y-3 rounded-xl border border-border p-4 bg-muted/20">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold">{currentSection.title}</Label>
                  {sections.length > 1 && (
                    <Button variant="ghost" size="sm" className="text-destructive text-xs" onClick={() => removeSection(currentSectionIdx)}>
                      <Trash2 className="w-3 h-3 mr-1" /> Remove
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Section Title</Label>
                  <Input value={currentSection.title} onChange={(e) => updateSection(currentSectionIdx, "title", e.target.value)} className="h-8 text-sm" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Question Type</Label>
                    <Select value={currentSection.question_type} onValueChange={(v) => updateSection(currentSectionIdx, "question_type", v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{QUESTION_TYPES.map((t) => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Number of Questions</Label>
                    <Input type="number" value={currentSection.num_questions} onChange={(e) => updateSection(currentSectionIdx, "num_questions", parseInt(e.target.value) || 0)} className="h-8 text-xs" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={!!currentSection.reading_passage} onCheckedChange={(checked) => updateSection(currentSectionIdx, "reading_passage", checked ? " " : "")} />
                    <Label className="text-xs">Include Reading Passage</Label>
                  </div>
                  {currentSection.reading_passage && (
                    <>
                      <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1 w-full" onClick={() => handleGeneratePassage(currentSectionIdx)} disabled={generatingPassage}>
                        {generatingPassage ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        Generate Passage with AI
                      </Button>
                      <Textarea value={currentSection.reading_passage.trim()} onChange={(e) => updateSection(currentSectionIdx, "reading_passage", e.target.value)} placeholder="Paste reading passage here or generate with AI..." rows={4} className="text-xs" />
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Difficulty Distribution</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["easy", "medium", "hard"] as const).map((d) => (
                      <div key={d} className="space-y-1">
                        <Label className="text-[10px] capitalize">{d}</Label>
                        <Input type="number" min={0} value={currentSection[`difficulty_${d}`]} onChange={(e) => updateSection(currentSectionIdx, `difficulty_${d}`, parseInt(e.target.value) || 0)} className="h-7 text-xs" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Cognitive Levels (Bloom's)</Label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {COGNITIVE_LEVELS.map((level) => (
                      <button key={level} onClick={() => toggleCognitive(currentSectionIdx, level)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                          currentSection.cognitive_levels.includes(level) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}>
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-right text-sm font-bold">
                Total: {sections.reduce((s, sec) => s + sec.num_questions, 0)} soal
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Total: <span className="font-bold text-foreground">{totalQuestionsInBuilder}</span> questions · Duration: <span className="font-bold text-foreground">{durationMinutes} min</span>
              </div>

              {sections.map((sec, idx) => {
                const qs = sectionQuestions[idx] || [];
                return (
                  <div key={idx} className="rounded-xl border border-border p-3 space-y-2 bg-muted/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-sm">{sec.title}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {QUESTION_TYPES.find((t) => t.value === sec.question_type)?.label} · {sec.num_questions} questions
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1" onClick={() => handleAiGenerate(idx)} disabled={generatingSection !== null}>
                          {generatingSection === idx ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                          AI Generate
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {sec.difficulty_easy > 0 && <Badge variant="secondary" className="text-[10px]">Easy: {sec.difficulty_easy}</Badge>}
                      {sec.difficulty_medium > 0 && <Badge variant="secondary" className="text-[10px]">Medium: {sec.difficulty_medium}</Badge>}
                      {sec.difficulty_hard > 0 && <Badge variant="secondary" className="text-[10px]">Hard: {sec.difficulty_hard}</Badge>}
                      {sec.cognitive_levels.map((l) => <Badge key={l} variant="outline" className="text-[10px]">{l}</Badge>)}
                    </div>

                    {qs.length > 0 ? (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {qs.map((q, qi) => (
                          <div key={qi} className="text-xs p-2 rounded-lg bg-background border border-border/50 flex items-start gap-2">
                            <span className="font-bold text-muted-foreground shrink-0">{qi + 1}.</span>
                            <span className="flex-1 line-clamp-2">{q.question_text}</span>
                            <Badge variant="outline" className="text-[9px] shrink-0">{q.difficulty}</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No questions yet — click AI Generate</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="gap-1">
                <ChevronLeft className="w-4 h-4" /> Back
              </Button>
            )}
            <div className="flex-1" />
            {step < 3 ? (
              <Button onClick={() => {
                if (step === 1 && (!title.trim() || selectedClassIds.length === 0)) {
                  toast({ title: "Title and at least 1 class are required", variant: "destructive" });
                  return;
                }
                setStep(step + 1);
              }} className="gap-1">
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />} Save as Draft
                </Button>
                <Button onClick={() => handleSave(true)} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />} Save & Activate
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TKA Builder Dialog */}
      <Dialog open={tkaDialogOpen} onOpenChange={setTkaDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Buat Assessment TKA</DialogTitle>
            <DialogDescription>
              Tes Kemampuan Akademik Bahasa Inggris — berdasarkan kerangka asesmen resmi
            </DialogDescription>
          </DialogHeader>
          <TkaBuilder classes={classes} onSaved={() => { setTkaDialogOpen(false); fetchAssessments(); }} />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assessment?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the assessment and all its questions.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminAssessments;
