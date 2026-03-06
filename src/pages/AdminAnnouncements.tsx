import AdminLayout from "@/components/admin/AdminLayout";
import AnnouncementSection from "@/components/admin/AnnouncementSection";

const AdminAnnouncements = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="font-display font-bold text-2xl">Announcements</h2>
          <p className="text-muted-foreground mt-1">Manage and post announcements for your students</p>
        </div>
        <AnnouncementSection />
      </div>
    </AdminLayout>
  );
};

export default AdminAnnouncements;
