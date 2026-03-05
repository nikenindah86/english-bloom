import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Copy, Megaphone, Users, FileText, ClipboardList, Plus, Settings, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const AdminClassDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");

  const { data: cls } = useQuery({
    queryKey: ["class-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("classes").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: students = [] } = useQuery({
    queryKey: ["class-students", id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, avatar_url").eq("class_id", id!);
      return data || [];
    },
    enabled: !!id,
  });

  const { data: materials = [] } = useQuery({
    queryKey: ["class-materials", id],
    queryFn: async () => {
      const { data } = await supabase.from("materials").select("*").eq("class_id", id!).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!id,
  });

  const { data: quizzes = [] } = useQuery({
    queryKey: ["class-quizzes", id],
    queryFn: async () => {
      const { data } = await supabase.from("quizzes").select("*").eq("class_id", id!).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!id,
  });

  const { data: announcements = [] } = useQuery({
    queryKey: ["class-announcements"],
    queryFn: async () => {
      const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(10);
      return data || [];
    },
  });

  const generateCode = useMutation({
    mutationFn: async () => {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { error } = await supabase.from("classes").update({ join_code: code }).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-detail", id] });
      toast.success("Join code generated!");
    },
  });

  const postAnnouncement = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("announcements").insert({ title: annTitle, content: annContent });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-announcements"] });
      setAnnouncementOpen(false);
      setAnnTitle("");
      setAnnContent("");
      toast.success("Announcement posted!");
    },
  });

  const copyCode = () => {
    if (cls?.join_code) {
      navigator.clipboard.writeText(cls.join_code);
      toast.success("Code copied!");
    }
  };

  if (!cls) return <AdminLayout><div className="p-8 text-center text-muted-foreground">Loading...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigate("/admin/classes")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="font-display font-bold text-2xl">{cls.class_name}</h2>
            {cls.description && <p className="text-muted-foreground text-sm">{cls.description}</p>}
          </div>
        </div>

        {/* Join Code */}
        <div className="glass rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Join Code</p>
            <p className="font-display font-bold text-lg tracking-widest">
              {cls.join_code || "Not set"}
            </p>
          </div>
          <div className="flex gap-2">
            {cls.join_code && (
              <Button variant="outline" size="sm" className="rounded-xl gap-1" onClick={copyCode}>
                <Copy className="w-3 h-3" /> Copy
              </Button>
            )}
            <Button variant="outline" size="sm" className="rounded-xl gap-1" onClick={() => generateCode.mutate()}>
              <RefreshCw className="w-3 h-3" /> {cls.join_code ? "Regenerate" : "Generate"}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="stream">
          <TabsList className="w-full rounded-xl bg-muted/50">
            <TabsTrigger value="stream" className="flex-1 rounded-lg text-xs font-bold gap-1">
              <Megaphone className="w-3 h-3" /> Stream
            </TabsTrigger>
            <TabsTrigger value="students" className="flex-1 rounded-lg text-xs font-bold gap-1">
              <Users className="w-3 h-3" /> Students
            </TabsTrigger>
            <TabsTrigger value="content" className="flex-1 rounded-lg text-xs font-bold gap-1">
              <FileText className="w-3 h-3" /> Content
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stream" className="mt-4 space-y-3">
            <Button onClick={() => setAnnouncementOpen(true)} className="rounded-xl gap-2 w-full" variant="outline">
              <Plus className="w-4 h-4" /> Post Announcement
            </Button>
            {announcements.length === 0 ? (
              <div className="glass rounded-2xl p-6 text-center">
                <p className="text-sm text-muted-foreground">No announcements yet</p>
              </div>
            ) : (
              announcements.map((a) => (
                <div key={a.id} className="glass rounded-2xl p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-display font-bold text-sm">{a.title}</p>
                    <span className="text-[10px] text-muted-foreground">{format(new Date(a.created_at), "MMM d")}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{a.content}</p>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="students" className="mt-4 space-y-2">
            <p className="text-sm text-muted-foreground mb-2">{students.length} student{students.length !== 1 ? "s" : ""}</p>
            {students.length === 0 ? (
              <div className="glass rounded-2xl p-6 text-center">
                <p className="text-sm text-muted-foreground">No students in this class</p>
              </div>
            ) : (
              students.map((s) => (
                <div key={s.id} className="glass rounded-2xl p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <span className="text-xs font-bold text-secondary-foreground">
                      {(s.full_name || "?")[0].toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm font-medium truncate">{s.full_name || "Unnamed"}</p>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="content" className="mt-4 space-y-4">
            <div className="space-y-2">
              <h4 className="font-display font-bold text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" /> Materials ({materials.length})
              </h4>
              {materials.length === 0 ? (
                <p className="text-xs text-muted-foreground">No materials assigned to this class</p>
              ) : (
                materials.map((m) => (
                  <div key={m.id} className="glass rounded-xl p-3 flex items-center gap-3">
                    <Badge variant="secondary" className="text-[10px]">{m.type}</Badge>
                    <span className="text-sm truncate">{m.title}</span>
                  </div>
                ))
              )}
            </div>
            <div className="space-y-2">
              <h4 className="font-display font-bold text-sm flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-primary" /> Quizzes ({quizzes.length})
              </h4>
              {quizzes.length === 0 ? (
                <p className="text-xs text-muted-foreground">No quizzes assigned to this class</p>
              ) : (
                quizzes.map((q) => (
                  <div key={q.id} className="glass rounded-xl p-3 flex items-center gap-3">
                    <Badge variant={q.is_active ? "default" : "secondary"} className="text-[10px]">
                      {q.is_active ? "Active" : "Draft"}
                    </Badge>
                    <span className="text-sm truncate">{q.title}</span>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={announcementOpen} onOpenChange={setAnnouncementOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Post Announcement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} placeholder="Title" className="rounded-xl" />
            <Textarea value={annContent} onChange={(e) => setAnnContent(e.target.value)} placeholder="Content..." className="rounded-xl" />
          </div>
          <DialogFooter>
            <Button onClick={() => postAnnouncement.mutate()} disabled={!annTitle.trim() || !annContent.trim()} className="rounded-xl w-full">
              Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminClassDetail;
