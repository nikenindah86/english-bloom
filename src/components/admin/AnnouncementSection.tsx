import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Megaphone, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const AnnouncementSection = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("announcements")
        .insert({ title, content });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      setTitle("");
      setContent("");
      setShowForm(false);
      toast.success("Announcement posted!");
    },
    onError: () => toast.error("Failed to post announcement"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("announcements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Announcement deleted");
    },
    onError: () => toast.error("Failed to delete"),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-lg flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-primary" />
          Announcements
        </h3>
        <Button
          size="sm"
          variant={showForm ? "ghost" : "default"}
          className="rounded-xl gap-1"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cancel" : "New"}
        </Button>
      </div>

      {showForm && (
        <div className="glass rounded-2xl p-4 space-y-3">
          <Input
            placeholder="Announcement title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-xl"
          />
          <Textarea
            placeholder="Write your announcement..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="rounded-xl min-h-[80px]"
          />
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!title.trim() || !content.trim() || createMutation.isPending}
            className="rounded-xl w-full"
          >
            {createMutation.isPending ? "Posting..." : "Post Announcement"}
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="glass rounded-2xl p-6 text-center">
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="glass rounded-2xl p-6 text-center space-y-2">
          <Megaphone className="w-8 h-8 mx-auto text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div key={a.id} className="glass rounded-2xl p-4 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display font-bold text-sm">{a.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(a.created_at), "MMM d, yyyy · h:mm a")}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteMutation.mutate(a.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-foreground/80">{a.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnnouncementSection;
