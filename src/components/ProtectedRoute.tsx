import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;

  // Optional authorization check
  allow?: () => boolean;
}

const ProtectedRoute = ({
  children,
  redirectTo = "/login",
  allow,
}: ProtectedRouteProps) => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated === false) {
    return <Navigate to={redirectTo} />;
  }

  if (allow && !allow()) {
    return <Navigate to="/exams" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
