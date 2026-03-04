import AdminLayout from "@/components/admin/AdminLayout";
import { ClipboardList } from "lucide-react";

const AdminQuizzes = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="font-display font-bold text-2xl">Quizzes</h2>
          <p className="text-muted-foreground mt-1">Create and manage quizzes</p>
        </div>
        <div className="glass rounded-2xl p-8 text-center space-y-2">
          <ClipboardList className="w-10 h-10 mx-auto text-muted-foreground/40" />
          <p className="text-muted-foreground font-medium">Quiz management coming soon</p>
          <p className="text-muted-foreground text-sm">Create questions, set deadlines, and grade submissions</p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminQuizzes;
