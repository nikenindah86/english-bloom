import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface StreamCommentsProps {
  announcementId: string;
  isTeacher?: boolean;
}

const StreamComments = ({ announcementId, isTeacher }: StreamCommentsProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");

  const { data: comments = [] } = useQuery({
    queryKey: ["stream-comments", announcementId],
    queryFn: async () => {
      const { data } = await supabase.from("stream_comments").select("*, profiles:user_id(full_name)").eq("announcement_id", announcementId).order("created_at");
      return data || [];
    },
  });

  const addComment = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("stream_comments").insert({
        announcement_id: announcementId, user_id: user!.id, content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stream-comments", announcementId] });
      setContent("");
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("stream_comments").delete().eq("id", id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stream-comments", announcementId] }),
  });

  return (
    <div className="space-y-2 mt-2 pl-2 border-l-2 border-border/30">
      {comments.map((c: any) => (
        <div key={c.id} className="flex items-start gap-2 group">
          <div className="flex-1 min-w-0">
            <p className="text-xs">
              <span className="font-semibold">{c.profiles?.full_name || "User"}</span>{" "}
              <span className="text-muted-foreground">{c.content}</span>
            </p>
            <p className="text-[10px] text-muted-foreground">{format(new Date(c.created_at), "MMM d, HH:mm")}</p>
          </div>
          {isTeacher && (
            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => deleteComment.mutate(c.id)}>
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      ))}
      <div className="flex gap-1.5">
        <Input value={content} onChange={e => setContent(e.target.value)} placeholder="Comment..." className="rounded-lg h-7 text-xs" onKeyDown={e => e.key === "Enter" && content.trim() && addComment.mutate()} />
        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => content.trim() && addComment.mutate()} disabled={!content.trim()}>
          <Send className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};

export default StreamComments;
