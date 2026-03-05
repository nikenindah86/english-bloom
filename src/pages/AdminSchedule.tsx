import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, CalendarDays } from "lucide-react";
import { toast } from "sonner";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const AdminSchedule = () => {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [classId, setClassId] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [subject, setSubject] = useState("");

  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data } = await supabase.from("classes").select("id, class_name").eq("is_archived", false);
      return data || [];
    },
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ["admin-schedules", filterClass],
    queryFn: async () => {
      let q = supabase.from("class_schedules").select("*, classes(class_name)").order("day_of_week").order("start_time");
      if (filterClass) q = q.eq("class_id", filterClass);
      const { data } = await q;
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("class_schedules").insert({
        class_id: classId, day_of_week: Number(dayOfWeek), start_time: startTime, end_time: endTime, subject,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-schedules"] });
      setShowCreate(false);
      setClassId(""); setDayOfWeek(""); setStartTime(""); setEndTime(""); setSubject("");
      toast.success("Schedule added!");
    },
    onError: () => toast.error("Failed to add schedule"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("class_schedules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-schedules"] });
      toast.success("Deleted");
    },
  });

  // Group by day
  const grouped = DAYS.map((name, i) => ({
    name, day: i,
    items: schedules.filter((s: any) => s.day_of_week === i),
  })).filter(g => g.items.length > 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-2xl">Schedule</h2>
            <p className="text-muted-foreground mt-1">Weekly class timetable</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="rounded-xl gap-2"><Plus className="w-4 h-4" /> Add</Button>
        </div>

        <Select value={filterClass} onValueChange={setFilterClass}>
          <SelectTrigger className="rounded-xl w-48"><SelectValue placeholder="All classes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All classes</SelectItem>
            {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.class_name}</SelectItem>)}
          </SelectContent>
        </Select>

        {grouped.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <CalendarDays className="w-10 h-10 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium mt-2">No schedule entries</p>
          </div>
        ) : (
          <div className="space-y-4">
            {grouped.map(g => (
              <div key={g.day} className="space-y-2">
                <h3 className="font-display font-bold text-sm text-primary">{g.name}</h3>
                {g.items.map((s: any) => (
                  <div key={s.id} className="glass rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{s.subject}</p>
                      <p className="text-xs text-muted-foreground">{s.start_time?.slice(0, 5)} – {s.end_time?.slice(0, 5)} · {s.classes?.class_name}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(s.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle className="font-display">Add Schedule</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select class" /></SelectTrigger>
              <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.class_name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Day of week" /></SelectTrigger>
              <SelectContent>{DAYS.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}</SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="rounded-xl" placeholder="Start" />
              <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="rounded-xl" placeholder="End" />
            </div>
            <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject name" className="rounded-xl" />
          </div>
          <DialogFooter>
            <Button onClick={() => createMutation.mutate()} disabled={!classId || !dayOfWeek || !startTime || !endTime || !subject.trim()} className="rounded-xl w-full">Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminSchedule;
