import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import StudentLayout from "@/components/student/StudentLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Save } from "lucide-react";
import { toast } from "sonner";

const StudentProfile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    place_of_birth: "",
    date_of_birth: "",
    gender: "",
    address: "",
    phone: "",
    parent_name: "",
  });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, place_of_birth, date_of_birth, gender, address, phone, parent_name")
        .eq("id", user.id)
        .single();
      if (data) {
        setProfile({
          full_name: data.full_name || "",
          place_of_birth: data.place_of_birth || "",
          date_of_birth: data.date_of_birth || "",
          gender: data.gender || "",
          address: data.address || "",
          phone: data.phone || "",
          parent_name: data.parent_name || "",
        });
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name || null,
        place_of_birth: profile.place_of_birth || null,
        date_of_birth: profile.date_of_birth || null,
        gender: profile.gender || null,
        address: profile.address || null,
        phone: profile.phone || null,
        parent_name: profile.parent_name || null,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to save profile");
    } else {
      toast.success("Profile saved!");
    }
  };

  const update = (key: string, value: string) =>
    setProfile((prev) => ({ ...prev, [key]: value }));

  if (loading) {
    return (
      <StudentLayout>
        <div className="glass rounded-2xl p-8 text-center">
          <p className="text-muted-foreground text-sm">Loading profile...</p>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h2 className="font-display font-bold text-2xl flex items-center gap-2">
            <User className="w-6 h-6 text-primary" /> My Profile
          </h2>
          <p className="text-muted-foreground mt-1">Update your personal information</p>
        </div>

        <div className="glass rounded-2xl p-5 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Full Name</label>
            <Input value={profile.full_name} onChange={(e) => update("full_name", e.target.value)} className="rounded-xl" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Place of Birth</label>
              <Input value={profile.place_of_birth} onChange={(e) => update("place_of_birth", e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date of Birth</label>
              <Input type="date" value={profile.date_of_birth} onChange={(e) => update("date_of_birth", e.target.value)} className="rounded-xl" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Gender</label>
            <Select value={profile.gender} onValueChange={(v) => update("gender", v)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Address</label>
            <Input value={profile.address} onChange={(e) => update("address", e.target.value)} className="rounded-xl" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Phone</label>
            <Input value={profile.phone} onChange={(e) => update("phone", e.target.value)} className="rounded-xl" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Parent/Guardian Name</label>
            <Input value={profile.parent_name} onChange={(e) => update("parent_name", e.target.value)} className="rounded-xl" />
          </div>

          <Button onClick={handleSave} disabled={saving} className="rounded-xl w-full gap-2">
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentProfile;
