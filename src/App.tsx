import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AdminDashboard from "./pages/AdminDashboard";
import AdminStudents from "./pages/AdminStudents";
import AdminMaterials from "./pages/AdminMaterials";
import AdminQuizzes from "./pages/AdminQuizzes";
import AdminGrading from "./pages/AdminGrading";
import AdminAttendance from "./pages/AdminAttendance";
import AdminClasses from "./pages/AdminClasses";
import AdminClassDetail from "./pages/AdminClassDetail";
import AdminManualGrades from "./pages/AdminManualGrades";
import AdminAssignments from "./pages/AdminAssignments";
import AdminSchedule from "./pages/AdminSchedule";
import AdminStudentNotes from "./pages/AdminStudentNotes";
import AdminLessonPlans from "./pages/AdminLessonPlans";
import AdminAssessments from "./pages/AdminAssessments";
import AdminAnnouncements from "./pages/AdminAnnouncements";
import StudentDashboard from "./pages/StudentDashboard";
import StudentMaterials from "./pages/StudentMaterials";
import StudentQuizzes from "./pages/StudentQuizzes";
import StudentQuiz from "./pages/StudentQuiz";
import StudentGrades from "./pages/StudentGrades";
import StudentProfile from "./pages/StudentProfile";
import StudentAssignments from "./pages/StudentAssignments";
import StudentSchedule from "./pages/StudentSchedule";
import StudentAssessments from "./pages/StudentAssessments";
import StudentAssessment from "./pages/StudentAssessment";
import AdminCourses from "./pages/AdminCourses";
import AdminCourseDetail from "./pages/AdminCourseDetail";
import AdminProducts from "./pages/AdminProducts";
import StudentCourses from "./pages/StudentCourses";
import StudentCourseDetail from "./pages/StudentCourseDetail";
import StudentLesson from "./pages/StudentLesson";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/admin" element={<ProtectedRoute requiredRole="teacher"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/students" element={<ProtectedRoute requiredRole="teacher"><AdminStudents /></ProtectedRoute>} />
            <Route path="/admin/materials" element={<ProtectedRoute requiredRole="teacher"><AdminMaterials /></ProtectedRoute>} />
            <Route path="/admin/quizzes" element={<ProtectedRoute requiredRole="teacher"><AdminQuizzes /></ProtectedRoute>} />
            <Route path="/admin/grading" element={<ProtectedRoute requiredRole="teacher"><AdminGrading /></ProtectedRoute>} />
            <Route path="/admin/attendance" element={<ProtectedRoute requiredRole="teacher"><AdminAttendance /></ProtectedRoute>} />
            <Route path="/admin/classes" element={<ProtectedRoute requiredRole="teacher"><AdminClasses /></ProtectedRoute>} />
            <Route path="/admin/classes/:id" element={<ProtectedRoute requiredRole="teacher"><AdminClassDetail /></ProtectedRoute>} />
            <Route path="/admin/manual-grades" element={<ProtectedRoute requiredRole="teacher"><AdminManualGrades /></ProtectedRoute>} />
            <Route path="/admin/assignments" element={<ProtectedRoute requiredRole="teacher"><AdminAssignments /></ProtectedRoute>} />
            <Route path="/admin/schedule" element={<ProtectedRoute requiredRole="teacher"><AdminSchedule /></ProtectedRoute>} />
            <Route path="/admin/student-notes" element={<ProtectedRoute requiredRole="teacher"><AdminStudentNotes /></ProtectedRoute>} />
            <Route path="/admin/lesson-plans" element={<ProtectedRoute requiredRole="teacher"><AdminLessonPlans /></ProtectedRoute>} />
            <Route path="/admin/assessments" element={<ProtectedRoute requiredRole="teacher"><AdminAssessments /></ProtectedRoute>} />
            <Route path="/admin/announcements" element={<ProtectedRoute requiredRole="teacher"><AdminAnnouncements /></ProtectedRoute>} />
            <Route path="/admin/courses" element={<ProtectedRoute requiredRole="teacher"><AdminCourses /></ProtectedRoute>} />
            <Route path="/admin/courses/:id" element={<ProtectedRoute requiredRole="teacher"><AdminCourseDetail /></ProtectedRoute>} />
            <Route path="/admin/products" element={<ProtectedRoute requiredRole="teacher"><AdminProducts /></ProtectedRoute>} />
            <Route path="/student" element={<ProtectedRoute requiredRole="student"><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/materials" element={<ProtectedRoute requiredRole="student"><StudentMaterials /></ProtectedRoute>} />
            <Route path="/student/quizzes" element={<ProtectedRoute requiredRole="student"><StudentQuizzes /></ProtectedRoute>} />
            <Route path="/student/quiz/:id" element={<ProtectedRoute requiredRole="student"><StudentQuiz /></ProtectedRoute>} />
            <Route path="/student/grades" element={<ProtectedRoute requiredRole="student"><StudentGrades /></ProtectedRoute>} />
            <Route path="/student/profile" element={<ProtectedRoute requiredRole="student"><StudentProfile /></ProtectedRoute>} />
            <Route path="/student/assignments" element={<ProtectedRoute requiredRole="student"><StudentAssignments /></ProtectedRoute>} />
            <Route path="/student/schedule" element={<ProtectedRoute requiredRole="student"><StudentSchedule /></ProtectedRoute>} />
            <Route path="/student/assessments" element={<ProtectedRoute requiredRole="student"><StudentAssessments /></ProtectedRoute>} />
            <Route path="/student/assessment/:id" element={<ProtectedRoute requiredRole="student"><StudentAssessment /></ProtectedRoute>} />
            <Route path="/student/courses" element={<ProtectedRoute requiredRole="student"><StudentCourses /></ProtectedRoute>} />
            <Route path="/student/courses/:courseId" element={<ProtectedRoute requiredRole="student"><StudentCourseDetail /></ProtectedRoute>} />
            <Route path="/student/courses/:courseId/lessons/:lessonId" element={<ProtectedRoute requiredRole="student"><StudentLesson /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
