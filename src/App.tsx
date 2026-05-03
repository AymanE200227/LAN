import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminStages from "./pages/admin/AdminStages";
import AdminStageCourses from "./pages/admin/AdminStageCourses";
import AdminCourseEdit from "./pages/admin/AdminCourseEdit";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminQuizzes from "./pages/admin/AdminQuizzes";
import StudentLayout from "./pages/student/StudentLayout";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentCourses from "./pages/student/StudentCourses";
import StudentCourseView from "./pages/student/StudentCourseView";
import StudentQuizList from "./pages/student/StudentQuizList";
import StudentQuizTake from "./pages/student/StudentQuizTake";
import StudentResults from "./pages/student/StudentResults";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();
const Router = typeof window !== "undefined" && window.location.protocol === "file:" ? HashRouter : BrowserRouter;

function ProtectedRoute({ children, role }: { children: React.ReactNode; role: 'admin' | 'student' }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin/stages' : '/student'} replace />;
  return <>{children}</>;
}

function RootRedirect() {
  const { user } = useAuth();
  if (user) return <Navigate to={user.role === 'admin' ? '/admin/stages' : '/student'} replace />;
  return <LoginPage />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="stages" replace />} />
              <Route path="stages" element={<AdminStages />} />
              <Route path="stages/:stageId" element={<AdminStageCourses />} />
              <Route path="stages/:stageId/courses/:courseId" element={<AdminCourseEdit />} />
              <Route path="students" element={<AdminStudents />} />
              <Route path="quizzes" element={<AdminQuizzes />} />
            </Route>
            <Route path="/student" element={<ProtectedRoute role="student"><StudentLayout /></ProtectedRoute>}>
              <Route index element={<StudentDashboard />} />
              <Route path="courses" element={<StudentCourses />} />
              <Route path="courses/:courseId" element={<StudentCourseView />} />
              <Route path="quizzes" element={<StudentQuizList />} />
              <Route path="quizzes/:quizId" element={<StudentQuizTake />} />
              <Route path="results" element={<StudentResults />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
