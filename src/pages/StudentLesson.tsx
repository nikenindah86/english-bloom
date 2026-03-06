import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import StudentLayout from "@/components/student/StudentLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import DOMPurify from "dompurify";

const getVideoEmbed = (url: string) => {
  // YouTube
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  // Vimeo
  const vmMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vmMatch) return `https://player.vimeo.com/video/${vmMatch[1]}`;
  return null;
};

const StudentLesson = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: lesson } = useQuery({
    queryKey: ["student-lesson", lessonId],
    queryFn: async () => {
      const { data, error } = await supabase.from("lessons").select("*").eq("id", lessonId!).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: completion } = useQuery({
    queryKey: ["lesson-completion", lessonId],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("lesson_completions").select("id").eq("lesson_id", lessonId!).eq("student_id", user.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const markComplete = useMutation({
    mutationFn: async () => {
      if (completion) {
        await supabase.from("lesson_completions").delete().eq("id", completion.id);
      } else {
        const { error } = await supabase.from("lesson_completions").insert({ lesson_id: lessonId!, student_id: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lesson-completion", lessonId] });
      qc.invalidateQueries({ queryKey: ["student-course-completions", courseId] });
      qc.invalidateQueries({ queryKey: ["student-completions"] });
      toast.success(completion ? "Unmarked" : "Lesson completed! 🎉");
    },
  });

  const embedUrl = lesson?.video_url ? getVideoEmbed(lesson.video_url) : null;
  const isDirectVideo = lesson?.video_url && !embedUrl;
  const isCompleted = !!completion;

  return (
    <StudentLayout>
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/student/courses/${courseId}`)} className="rounded-xl gap-2 -ml-2">
          <ArrowLeft className="w-4 h-4" /> Back to Course
        </Button>

        {/* Video Player */}
        {lesson?.video_url && (
          <div className="rounded-2xl overflow-hidden bg-black/5 aspect-video">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={lesson.title}
              />
            ) : isDirectVideo ? (
              <video controls className="w-full h-full" src={lesson.video_url}>
                Your browser does not support video playback.
              </video>
            ) : null}
          </div>
        )}

        {/* Title */}
        <h1 className="text-2xl font-display font-bold">{lesson?.title}</h1>

        {/* Rich text content */}
        {lesson?.content && (
          <div
            className="prose prose-sm max-w-none
              [&_img]:rounded-xl [&_img]:max-w-full
              [&_audio]:w-full [&_audio]:my-3 [&_audio]:rounded-xl
              [&_a]:text-primary [&_a]:underline
              prose-headings:font-display"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(lesson.content) }}
          />
        )}

        {/* Mark as Complete */}
        <Button
          onClick={() => markComplete.mutate()}
          disabled={markComplete.isPending}
          className={`w-full rounded-2xl h-12 text-base gap-2 ${isCompleted ? "bg-emerald-500 hover:bg-emerald-600" : ""}`}
          variant={isCompleted ? "default" : "default"}
        >
          <CheckCircle2 className="w-5 h-5" />
          {isCompleted ? "Completed ✓" : "Mark as Complete"}
        </Button>
      </div>
    </StudentLayout>
  );
};

export default StudentLesson;
