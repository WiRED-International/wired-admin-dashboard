import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import  { AuthProvider } from './context/AuthContext.tsx';
import App from './App.tsx';
import ErrorPage from './pages/ErrorPage.tsx';
import LoginPage from './pages/LoginPage.tsx';
import LoginRedirectWrapper from './components/LoginRedirectWrapper.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import AdminDashboard from './pages/AdminDashboard.tsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.tsx';
import PasswordResetPage from './pages/PasswordResetPage.tsx';
import UsersPage from './pages/Users.tsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute redirectTo='/login'>
            <AdminDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: '/login',
        element: (
            <LoginRedirectWrapper>
                <LoginPage />
            </LoginRedirectWrapper>
        ),
      },
      {
        path: '/forgot-password',
        element: (
          <LoginRedirectWrapper>
            <ForgotPasswordPage />
          </LoginRedirectWrapper>
        ),
      },
      {
        path: '/reset-password/:token',
        element: (
          <LoginRedirectWrapper>
            <PasswordResetPage />
          </LoginRedirectWrapper>
        ),
      },
      {
        path: '/userview',
        element: (
          <ProtectedRoute redirectTo='/login'>
            <UsersPage />
          </ProtectedRoute>
        ),
      }
    ],
  },
], {
  basename: import.meta.env.VITE_MODE === 'dev' ? '/' : '/apiv2/',
});


const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
