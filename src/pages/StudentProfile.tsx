import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import StudentLayout from "@/components/student/StudentLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, Save, KeyRound, Camera } from "lucide-react";
import { toast } from "sonner";

const StudentProfile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [classes, setClasses] = useState<{ id: string; class_name: string }[]>([]);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState({
    full_name: "", class_id: "", place_of_birth: "", date_of_birth: "", gender: "", address: "", phone: "", parent_name: "", avatar_url: "",
  });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data }, { data: classData }] = await Promise.all([
        supabase.from("profiles").select("full_name, class_id, place_of_birth, date_of_birth, gender, address, phone, parent_name, avatar_url").eq("id", user.id).single(),
        supabase.from("classes").select("id, class_name").eq("is_archived", false).order("class_name"),
      ]);
      if (data) {
        setProfile({
          full_name: data.full_name || "", class_id: data.class_id || "",
          place_of_birth: data.place_of_birth || "", date_of_birth: data.date_of_birth || "",
          gender: data.gender || "", address: data.address || "", phone: data.phone || "",
          parent_name: data.parent_name || "", avatar_url: data.avatar_url || "",
        });
      }
      setClasses(classData || []);
      setLoading(false);
    };
    load();
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadErr) { toast.error("Failed to upload photo"); setUploading(false); return; }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    const { error: updateErr } = await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", user.id);
    if (updateErr) { toast.error("Failed to save photo"); } else {
      setProfile(p => ({ ...p, avatar_url: avatarUrl }));
      toast.success("Photo updated!");
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: profile.full_name || null, class_id: profile.class_id || null,
      place_of_birth: profile.place_of_birth || null, date_of_birth: profile.date_of_birth || null,
      gender: profile.gender || null, address: profile.address || null, phone: profile.phone || null, parent_name: profile.parent_name || null,
    }).eq("id", user.id);
    setSaving(false);
    error ? toast.error("Failed to save profile") : toast.success("Profile saved!");
  };

  const handleJoinByCode = async () => {
    if (!user || !joinCode.trim()) return;
    setJoining(true);
    const { data: cls } = await supabase.from("classes").select("id, class_name").eq("join_code", joinCode.trim().toUpperCase()).single();
    if (!cls) { toast.error("Invalid class code"); setJoining(false); return; }
    const { error } = await supabase.from("profiles").update({ class_id: cls.id }).eq("id", user.id);
    if (error) { toast.error("Failed to join class"); } else {
      toast.success(`Joined ${cls.class_name}!`);
      setProfile((p) => ({ ...p, class_id: cls.id }));
      setJoinCode("");
    }
    setJoining(false);
  };

  const update = (key: string, value: string) => setProfile((prev) => ({ ...prev, [key]: value }));

  if (loading) return <StudentLayout><div className="glass rounded-2xl p-8 text-center"><p className="text-muted-foreground text-sm">Loading profile...</p></div></StudentLayout>;

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h2 className="font-display font-bold text-2xl flex items-center gap-2"><User className="w-6 h-6 text-primary" /> My Profile</h2>
          <p className="text-muted-foreground mt-1">Update your personal information</p>
        </div>

        {/* Avatar Upload */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
              {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.full_name} />}
              <AvatarFallback className="bg-accent text-accent-foreground text-2xl font-bold">
                {(profile.full_name || "?")[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 text-white" />
            </div>
            {uploading && (
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Tap to change photo</p>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        </div>

        {/* Join by Code */}
        <div className="glass rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-primary" />
            <span className="font-display font-bold text-sm">Join Class by Code</span>
          </div>
          <div className="flex gap-2">
            <Input value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="Enter class code" className="rounded-xl font-mono uppercase" maxLength={6} />
            <Button onClick={handleJoinByCode} disabled={!joinCode.trim() || joining} className="rounded-xl shrink-0">
              {joining ? "Joining..." : "Join"}
            </Button>
          </div>
        </div>

        <div className="glass rounded-2xl p-5 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Full Name</label>
            <Input value={profile.full_name} onChange={(e) => update("full_name", e.target.value)} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Class</label>
            <Select value={profile.class_id} onValueChange={(v) => update("class_id", v)}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select your class" /></SelectTrigger>
              <SelectContent>{classes.map((c) => (<SelectItem key={c.id} value={c.id}>{c.class_name}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><label className="text-sm font-medium">Place of Birth</label><Input value={profile.place_of_birth} onChange={(e) => update("place_of_birth", e.target.value)} className="rounded-xl" /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Date of Birth</label><Input type="date" value={profile.date_of_birth} onChange={(e) => update("date_of_birth", e.target.value)} className="rounded-xl" /></div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Gender</label>
            <Select value={profile.gender} onValueChange={(v) => update("gender", v)}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select gender" /></SelectTrigger>
              <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><label className="text-sm font-medium">Address</label><Input value={profile.address} onChange={(e) => update("address", e.target.value)} className="rounded-xl" /></div>
          <div className="space-y-2"><label className="text-sm font-medium">Phone</label><Input value={profile.phone} onChange={(e) => update("phone", e.target.value)} className="rounded-xl" /></div>
          <div className="space-y-2"><label className="text-sm font-medium">Parent/Guardian Name</label><Input value={profile.parent_name} onChange={(e) => update("parent_name", e.target.value)} className="rounded-xl" /></div>
          <Button onClick={handleSave} disabled={saving} className="rounded-xl w-full gap-2"><Save className="w-4 h-4" />{saving ? "Saving..." : "Save Profile"}</Button>
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentProfile;
