import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import StudentLayout from "@/components/student/StudentLayout";
import { CalendarDays } from "lucide-react";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const StudentSchedule = () => {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["my-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("class_id").eq("id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ["student-schedules", profile?.class_id],
    queryFn: async () => {
      if (!profile?.class_id) return [];
      const { data } = await supabase.from("class_schedules").select("*").eq("class_id", profile.class_id).order("day_of_week").order("start_time");
      return data || [];
    },
    enabled: !!profile?.class_id,
  });

  const grouped = DAYS.map((name, i) => ({
    name, day: i,
    items: schedules.filter((s: any) => s.day_of_week === i),
  })).filter(g => g.items.length > 0);

  const today = new Date().getDay();

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h2 className="font-display font-bold text-2xl">Schedule</h2>
          <p className="text-muted-foreground mt-1">Your weekly timetable</p>
        </div>

        {!profile?.class_id ? (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-sm text-muted-foreground">Join a class to see your schedule</p>
          </div>
        ) : grouped.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <CalendarDays className="w-10 h-10 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium mt-2">No schedule set</p>
          </div>
        ) : (
          <div className="space-y-4">
            {grouped.map(g => (
              <div key={g.day} className={`space-y-2 ${g.day === today ? "ring-1 ring-primary/30 rounded-2xl p-3 bg-accent/20" : ""}`}>
                <h3 className="font-display font-bold text-sm flex items-center gap-2">
                  {g.day === today && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                  {g.name}
                </h3>
                {g.items.map((s: any) => (
                  <div key={s.id} className="glass rounded-xl p-3">
                    <p className="text-sm font-medium">{s.subject}</p>
                    <p className="text-xs text-muted-foreground">{s.start_time?.slice(0, 5)} – {s.end_time?.slice(0, 5)}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentSchedule;
