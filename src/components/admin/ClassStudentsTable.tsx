import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Download, Users } from "lucide-react";
import { downloadCSV } from "@/lib/csvExport";
import { format } from "date-fns";

interface Props {
  classId: string;
  className: string;
}

const ClassStudentsTable = ({ classId, className: clsName }: Props) => {
  const { data: students = [], isLoading } = useQuery({
    queryKey: ["class-students", classId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, gender, place_of_birth, date_of_birth, phone, parent_name, address")
        .eq("class_id", classId)
        .order("full_name");
      return data || [];
    },
    enabled: !!classId,
  });

  const exportCSV = () => {
    const headers = ["No", "Nama", "Jenis Kelamin", "Tempat Lahir", "Tanggal Lahir", "Telepon", "Nama Orang Tua", "Alamat"];
    const rows = students.map((s, i) => [
      String(i + 1),
      s.full_name || "",
      s.gender ? s.gender.charAt(0).toUpperCase() + s.gender.slice(1) : "",
      s.place_of_birth || "",
      s.date_of_birth ? format(new Date(s.date_of_birth), "dd/MM/yyyy") : "",
      s.phone || "",
      s.parent_name || "",
      s.address || "",
    ]);
    const safeName = clsName.replace(/[^a-zA-Z0-9]/g, "_");
    downloadCSV(headers, rows, `Profil_Siswa_${safeName}.csv`);
  };

  if (isLoading) {
    return <div className="glass rounded-2xl p-6 text-center"><p className="text-sm text-muted-foreground">Loading...</p></div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{students.length} student{students.length !== 1 ? "s" : ""}</p>
        {students.length > 0 && (
          <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs" onClick={exportCSV}>
            <Download className="h-3.5 w-3.5" /> CSV
          </Button>
        )}
      </div>

      {students.length === 0 ? (
        <div className="glass rounded-2xl p-6 text-center space-y-2">
          <Users className="w-8 h-8 mx-auto text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No students in this class</p>
        </div>
      ) : (
        <ScrollArea className="w-full rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 text-center">No</TableHead>
                <TableHead className="min-w-[150px]">Nama</TableHead>
                <TableHead className="min-w-[90px]">Gender</TableHead>
                <TableHead className="min-w-[120px]">Tempat Lahir</TableHead>
                <TableHead className="min-w-[110px]">Tgl Lahir</TableHead>
                <TableHead className="min-w-[120px]">Telepon</TableHead>
                <TableHead className="min-w-[130px]">Orang Tua</TableHead>
                <TableHead className="min-w-[180px]">Alamat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s, i) => (
                <TableRow key={s.id}>
                  <TableCell className="text-center text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="font-medium">{s.full_name || "—"}</TableCell>
                  <TableCell>{s.gender ? s.gender.charAt(0).toUpperCase() + s.gender.slice(1) : "—"}</TableCell>
                  <TableCell>{s.place_of_birth || "—"}</TableCell>
                  <TableCell>{s.date_of_birth ? format(new Date(s.date_of_birth), "dd/MM/yyyy") : "—"}</TableCell>
                  <TableCell>{s.phone || "—"}</TableCell>
                  <TableCell>{s.parent_name || "—"}</TableCell>
                  <TableCell>{s.address || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </div>
  );
};

export default ClassStudentsTable;
