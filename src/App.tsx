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
import StudentDashboard from "./pages/StudentDashboard";
import StudentMaterials from "./pages/StudentMaterials";
import StudentQuizzes from "./pages/StudentQuizzes";
import StudentQuiz from "./pages/StudentQuiz";
import StudentGrades from "./pages/StudentGrades";
import StudentProfile from "./pages/StudentProfile";
import AdminClasses from "./pages/AdminClasses";
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
            <Route path="/student" element={<ProtectedRoute requiredRole="student"><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/materials" element={<ProtectedRoute requiredRole="student"><StudentMaterials /></ProtectedRoute>} />
            <Route path="/student/quizzes" element={<ProtectedRoute requiredRole="student"><StudentQuizzes /></ProtectedRoute>} />
            <Route path="/student/quiz/:id" element={<ProtectedRoute requiredRole="student"><StudentQuiz /></ProtectedRoute>} />
            <Route path="/student/grades" element={<ProtectedRoute requiredRole="student"><StudentGrades /></ProtectedRoute>} />
            <Route path="/student/profile" element={<ProtectedRoute requiredRole="student"><StudentProfile /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
