import { useState, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered,
  ImageIcon, LinkIcon, Music, Undo, Redo,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LessonEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { title: string; video_url: string; content: string }) => void;
  initialData?: { title: string; video_url: string; content: string };
  saving?: boolean;
}

const MenuButton = ({ active, onClick, children, title }: { active?: boolean; onClick: () => void; children: React.ReactNode; title: string }) => (
  <Button
    type="button"
    variant="ghost"
    size="icon"
    className={cn("h-8 w-8 rounded-lg", active && "bg-accent text-accent-foreground")}
    onClick={onClick}
    title={title}
  >
    {children}
  </Button>
);

const LessonEditor = ({ open, onOpenChange, onSave, initialData, saving }: LessonEditorProps) => {
  const [title, setTitle] = useState(initialData?.title || "");
  const [videoUrl, setVideoUrl] = useState(initialData?.video_url || "");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false }),
    ],
    content: initialData?.content || "<p>Write your lesson content here...</p>",
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-[200px] p-4 focus:outline-none [&_img]:rounded-xl [&_img]:max-w-full [&_audio]:w-full [&_audio]:my-3",
      },
    },
  });

  const handleImageUpload = useCallback(async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !editor) return;
      const ext = file.name.split(".").pop();
      const path = `lessons/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("materials").upload(path, file);
      if (error) { toast.error("Upload failed"); return; }
      const { data: urlData } = supabase.storage.from("materials").getPublicUrl(path);
      editor.chain().focus().setImage({ src: urlData.publicUrl }).run();
      toast.success("Image inserted");
    };
    input.click();
  }, [editor]);

  const handleAudioUpload = useCallback(async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "audio/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !editor) return;
      const ext = file.name.split(".").pop();
      const path = `lessons/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("materials").upload(path, file);
      if (error) { toast.error("Upload failed"); return; }
      const { data: urlData } = supabase.storage.from("materials").getPublicUrl(path);
      editor.chain().focus().insertContent(
        `<p><audio controls src="${urlData.publicUrl}" class="w-full rounded-xl"></audio></p>`
      ).run();
      toast.success("Audio inserted");
    };
    input.click();
  }, [editor]);

  const handleAddLink = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("Enter URL:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  const handleSave = () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    onSave({ title, video_url: videoUrl, content: editor?.getHTML() || "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{initialData ? "Edit Lesson" : "New Lesson"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Lesson Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Introduction to TOEFL Reading" />
          </div>
          <div>
            <Label>Video URL (optional)</Label>
            <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="YouTube, Vimeo, or direct video link" />
          </div>
          <div>
            <Label>Content</Label>
            <div className="border border-border rounded-xl overflow-hidden bg-card">
              {editor && (
                <div className="flex flex-wrap gap-0.5 p-1.5 border-b border-border bg-muted/30">
                  <MenuButton active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1"><Heading1 className="h-4 w-4" /></MenuButton>
                  <MenuButton active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2"><Heading2 className="h-4 w-4" /></MenuButton>
                  <MenuButton active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3"><Heading3 className="h-4 w-4" /></MenuButton>
                  <div className="w-px bg-border mx-1" />
                  <MenuButton active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold"><Bold className="h-4 w-4" /></MenuButton>
                  <MenuButton active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic"><Italic className="h-4 w-4" /></MenuButton>
                  <div className="w-px bg-border mx-1" />
                  <MenuButton active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List"><List className="h-4 w-4" /></MenuButton>
                  <MenuButton active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Ordered List"><ListOrdered className="h-4 w-4" /></MenuButton>
                  <div className="w-px bg-border mx-1" />
                  <MenuButton onClick={handleImageUpload} title="Insert Image"><ImageIcon className="h-4 w-4" /></MenuButton>
                  <MenuButton onClick={handleAudioUpload} title="Insert Audio"><Music className="h-4 w-4" /></MenuButton>
                  <MenuButton active={editor.isActive("link")} onClick={handleAddLink} title="Add Link"><LinkIcon className="h-4 w-4" /></MenuButton>
                  <div className="w-px bg-border mx-1" />
                  <MenuButton onClick={() => editor.chain().focus().undo().run()} title="Undo"><Undo className="h-4 w-4" /></MenuButton>
                  <MenuButton onClick={() => editor.chain().focus().redo().run()} title="Redo"><Redo className="h-4 w-4" /></MenuButton>
                </div>
              )}
              <EditorContent editor={editor} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Lesson"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LessonEditor;
