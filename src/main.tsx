import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.tsx";
import App from "./App.tsx";
import Auth from "@/utils/auth";
import ErrorPage from "./pages/ErrorPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import LoginRedirectWrapper from "./components/LoginRedirectWrapper.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.tsx";
import PasswordResetPage from "./pages/PasswordResetPage.tsx";
import UsersPage from "./pages/Users.tsx";
import ExamsPage from "./pages/ExamsPage.tsx"
import ScheduleExamPage from "./pages/ScheduleExamPage.tsx";
import ScheduledExamsPage from "./pages/ScheduledExamsPage";
import ExamDetailsPage from "./pages/ExamDetailsPage.tsx";
import { UserOptionsProvider } from "./context/UserOptionsContext.tsx";
import ExamAttemptDetailsPage from "./pages/ExamAttemptDetailsPage.tsx";
import ExamTemplatesPage from "./pages/ExamTemplatesPage.tsx";
import ExamTemplateDetailsPage from "./pages/ExamTemplateDetailsPage.tsx";
import ExamTemplateQuestionDetailsPage from "./pages/ExamTemplateQuestionDetailsPage.tsx";
import UserDetailsPage from "./pages/UserDetailsPage.tsx";

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <App />,
      errorElement: <ErrorPage />,
      children: [
        {
          index: true,
          element: (
            <ProtectedRoute redirectTo="/login">
              <AdminDashboard />
            </ProtectedRoute>
          ),
        },
        {
          path: "/login",
          element: (
            <LoginRedirectWrapper>
              <LoginPage />
            </LoginRedirectWrapper>
          ),
        },
        {
          path: "/forgot-password",
          element: (
            <LoginRedirectWrapper>
              <ForgotPasswordPage />
            </LoginRedirectWrapper>
          ),
        },
        {
          path: "/reset-password/:token",
          element: (
            <LoginRedirectWrapper>
              <PasswordResetPage />
            </LoginRedirectWrapper>
          ),
        },
        {
          path: "/userview",
          element: (
            <ProtectedRoute redirectTo="/login">
              <UsersPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "/userview/:userId",
          element: (
            <ProtectedRoute redirectTo="/login">
              <UserDetailsPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "/exams",
          element: (
            <ProtectedRoute redirectTo="/login">
              <ExamsPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "/exams/schedule",
          element: (
            <ProtectedRoute redirectTo="/login">
              <ScheduleExamPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "/exams/scheduled",
          element: (
            <ProtectedRoute redirectTo="/login">
              <ScheduledExamsPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "/exams/results/:sessionId",
          element: (
            <ProtectedRoute
              redirectTo="/login"
            >
              <ExamAttemptDetailsPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "/exams/templates",
          element: (
            <ProtectedRoute
              redirectTo="/login"
              allow={() => Auth.isSuperAdmin()}
            >
                <ExamTemplatesPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "/exams/templates/:templateId",
          element: (
            <ProtectedRoute redirectTo="/login">
              <ExamTemplateDetailsPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "/exams/:id",
          element: (
            <ProtectedRoute
              redirectTo="/login"
            >
              <ExamDetailsPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "/exams/templates/:templateId/questions/new",
          element: (
            <ProtectedRoute redirectTo="/login">
              <ExamTemplateQuestionDetailsPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "/exams/templates/:templateId/questions/:questionId",
          element: (
            <ProtectedRoute redirectTo="/login">
              <ExamTemplateQuestionDetailsPage />
            </ProtectedRoute>
          ),
        },
      ],
    },
  ],
  {
    basename: import.meta.env.MODE === "development" ? "/" : "/apiv2",
  }
);

const rootElement = document.getElementById("root");

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <AuthProvider>
      <UserOptionsProvider>
        <RouterProvider router={router} />
      </UserOptionsProvider>
    </AuthProvider>
  );
}