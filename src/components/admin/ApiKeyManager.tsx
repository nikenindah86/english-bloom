import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Key, Plus, Trash2, Eye, EyeOff, Settings } from "lucide-react";

type ApiKey = {
  id: string;
  api_key: string;
  label: string;
  is_active: boolean;
  created_at: string;
};

const ApiKeyManager = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newKey, setNewKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  const fetchKeys = async () => {
    setLoading(true);
    const { data } = await supabase.from("gemini_api_keys").select("*").order("created_at");
    setKeys((data as ApiKey[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (open) fetchKeys();
  }, [open]);

  const addKey = async () => {
    if (!newKey.trim()) { toast({ title: "API Key diperlukan", variant: "destructive" }); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("gemini_api_keys").insert({
      api_key: newKey.trim(),
      label: newLabel.trim() || `Key ${keys.length + 1}`,
      created_by: user!.id,
    } as any);
    if (error) toast({ title: "Gagal menambah key", variant: "destructive" });
    else { toast({ title: "API Key ditambahkan!" }); setNewKey(""); setNewLabel(""); fetchKeys(); }
    setSaving(false);
  };

  const toggleKey = async (key: ApiKey) => {
    await supabase.from("gemini_api_keys").update({ is_active: !key.is_active } as any).eq("id", key.id);
    fetchKeys();
  };

  const deleteKey = async () => {
    if (!deleteId) return;
    await supabase.from("gemini_api_keys").delete().eq("id", deleteId);
    setDeleteId(null);
    toast({ title: "API Key dihapus" });
    fetchKeys();
  };

  const toggleVisible = (id: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const maskKey = (key: string) => key.slice(0, 6) + "••••••••" + key.slice(-4);

  return (
    <>
      <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs" onClick={() => setOpen(true)}>
        <Settings className="w-3.5 h-3.5" /> API Keys
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Key className="w-4 h-4" /> Manage Gemini API Keys</DialogTitle>
            <DialogDescription>Tambahkan beberapa API key untuk rotasi otomatis saat rate-limited.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {/* Existing keys */}
            {keys.length === 0 && !loading && (
              <p className="text-xs text-muted-foreground text-center py-3">Belum ada API key. Tambahkan di bawah.</p>
            )}
            {keys.map((k) => (
              <div key={k.id} className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 p-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{k.label}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {visibleKeys.has(k.id) ? k.api_key : maskKey(k.api_key)}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleVisible(k.id)}>
                  {visibleKeys.has(k.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </Button>
                <Switch checked={k.is_active} onCheckedChange={() => toggleKey(k)} />
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(k.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}

            {/* Add new */}
            <div className="border-t border-border pt-3 space-y-2">
              <Label className="text-xs">Tambah API Key Baru</Label>
              <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Label (opsional)" className="h-8 text-xs" />
              <Input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="AIzaSy..." className="h-8 text-xs font-mono" type="password" />
              <Button onClick={addKey} disabled={saving} size="sm" className="w-full gap-1 rounded-xl text-xs">
                <Plus className="w-3 h-3" /> Tambah Key
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Hapus API Key?</AlertDialogTitle><AlertDialogDescription>Key ini akan dihapus permanen.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={deleteKey} className="bg-destructive text-destructive-foreground">Hapus</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ApiKeyManager;
