import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, ExternalLink, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

type Product = {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  price: number;
  checkout_link: string | null;
  is_active: boolean;
  created_at: string;
};

const emptyForm = { title: "", description: "", thumbnail_url: "", price: 0, checkout_link: "" };

const formatRupiah = (n: number) =>
  n === 0 ? "Gratis" : `Rp ${n.toLocaleString("id-ID")}`;

const AdminProducts = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Product[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title,
        description: form.description || null,
        thumbnail_url: form.thumbnail_url || null,
        price: form.price,
        checkout_link: form.checkout_link || null,
      };
      if (editing) {
        const { error } = await supabase.from("products").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success(editing ? "Produk diperbarui" : "Produk ditambahkan");
      closeDialog();
    },
    onError: () => toast.error("Gagal menyimpan produk"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Produk dihapus");
    },
  });

  const closeDialog = () => {
    setOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      title: p.title,
      description: p.description ?? "",
      thumbnail_url: p.thumbnail_url ?? "",
      price: p.price,
      checkout_link: p.checkout_link ?? "",
    });
    setOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Products</h1>
            <p className="text-sm text-muted-foreground">Kelola produk digital untuk dijual</p>
          </div>
          <Button onClick={() => { setForm(emptyForm); setEditing(null); setOpen(true); }} className="rounded-xl gap-2">
            <Plus className="w-4 h-4" /> Tambah Produk
          </Button>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground text-sm">Memuat...</p>
        ) : products.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground">Belum ada produk</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((p) => (
              <Card key={p.id} className="overflow-hidden rounded-2xl border-0 bg-gray-900 text-white shadow-xl">
                {p.thumbnail_url && (
                  <div className="aspect-video w-full overflow-hidden">
                    <img src={p.thumbnail_url} alt={p.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display font-bold text-lg leading-tight">{p.title}</h3>
                    <span
                      className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold ${
                        p.price > 0
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "border border-white/20 text-white/70"
                      }`}
                    >
                      {formatRupiah(p.price)}
                    </span>
                  </div>
                  {p.description && (
                    <p className="text-sm text-white/60 line-clamp-2">{p.description}</p>
                  )}
                  {p.checkout_link && (
                    <a
                      href={p.checkout_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm py-2.5 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" /> Beli Sekarang
                    </a>
                  )}
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="outline" className="flex-1 rounded-xl border-white/20 text-white hover:bg-white/10" onClick={() => openEdit(p)}>
                      <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-xl border-white/20 text-red-400 hover:bg-red-500/10 hover:text-red-300" onClick={() => remove.mutate(p.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={(v) => { if (!v) closeDialog(); else setOpen(true); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Produk" : "Tambah Produk"}</DialogTitle>
            <DialogDescription>Isi detail produk digital Anda</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => { e.preventDefault(); save.mutate(); }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Judul</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi Singkat</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Thumbnail URL</Label>
              <Input value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Harga (0 = Gratis)</Label>
              <Input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Checkout / Action Link</Label>
              <Input value={form.checkout_link} onChange={(e) => setForm({ ...form, checkout_link: e.target.value })} placeholder="https://..." />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={save.isPending} className="rounded-xl w-full">
                {save.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminProducts;
