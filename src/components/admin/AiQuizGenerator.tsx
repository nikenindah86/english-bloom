import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2 } from "lucide-react";

type QuestionDraft = {
  question_text: string;
  question_type: "text_input" | "multiple_choice";
  media_url: string;
  options: string[];
  correct_answer: string;
  order_index: number;
};

type Props = {
  onGenerated: (questions: QuestionDraft[]) => void;
};

const AiQuizGenerator = ({ onGenerated }: Props) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState("5");
  const [questionType, setQuestionType] = useState<"multiple_choice" | "text_input">("multiple_choice");
  
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) { toast({ title: "Topik diperlukan", variant: "destructive" }); return; }
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast({ title: "Sesi habis, silakan login ulang", variant: "destructive" }); return; }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-quiz`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            topic: topic.trim(),
            num_questions: parseInt(numQuestions),
            question_type: questionType,
            language: "English",
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || "Gagal generate quiz", variant: "destructive" });
        return;
      }

      if (data.questions?.length) {
        onGenerated(data.questions);
        toast({ title: `${data.questions.length} soal berhasil di-generate!`, description: `Model: ${data.model_used}` });
        setOpen(false);
        setTopic("");
      } else {
        toast({ title: "Tidak ada soal yang dihasilkan", variant: "destructive" });
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Error generating quiz", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1.5 rounded-xl text-xs">
        <Sparkles className="w-3.5 h-3.5" /> AI Generate
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> AI Quiz Generator</DialogTitle>
            <DialogDescription>Generate soal otomatis menggunakan AI. Hasilnya bisa diedit sebelum disimpan.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Topik / Mata Pelajaran</Label>
              <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Contoh: Fotosintesis, Perang Dunia II" className="text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Jumlah Soal</Label>
                <Select value={numQuestions} onValueChange={setNumQuestions}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[3, 5, 10, 15, 20].map((n) => (
                      <SelectItem key={n} value={n.toString()}>{n} soal</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tipe Soal</Label>
                <Select value={questionType} onValueChange={(v) => setQuestionType(v as any)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple_choice">Pilihan Ganda</SelectItem>
                    <SelectItem value="text_input">Isian</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={handleGenerate} disabled={generating} className="gap-2">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {generating ? "Generating..." : "Generate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AiQuizGenerator;
