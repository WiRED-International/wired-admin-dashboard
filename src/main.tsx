import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.tsx";
import App from "./App.tsx";
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
import ExamAttemptDetailsPage from "./pages/ExamAttemptDetailsPage";

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
          path: "/exams/:id",
          element: (
            <ProtectedRoute
              redirectTo="/login"
            >
              <ExamDetailsPage />
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