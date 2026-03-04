import { useEffect, useState } from "react";
import StudentLayout from "@/components/student/StudentLayout";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Download, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

const StudentMaterials = () => {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("materials")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setMaterials(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h2 className="font-display font-bold text-2xl">Materials 📚</h2>
          <p className="text-muted-foreground mt-1">Worksheets & tutorials from your teacher</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass rounded-2xl p-5 h-24 animate-pulse" />
            ))}
          </div>
        ) : materials.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center space-y-2">
            <BookOpen className="w-10 h-10 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">No materials uploaded yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {materials.map((m) => (
              <div key={m.id} className="glass rounded-2xl p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-secondary-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-display font-bold text-sm truncate">{m.title}</p>
                      <Badge variant="secondary" className="mt-1 text-[10px]">
                        {m.type}
                      </Badge>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {format(new Date(m.created_at), "MMM d")}
                  </span>
                </div>
                {m.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed">{m.description}</p>
                )}
                {m.file_url && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full rounded-xl text-xs"
                    onClick={() => window.open(m.file_url, "_blank")}
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    Download / View
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentMaterials;
