import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, initialAuthLoading } = useAuth();

  if (initialAuthLoading) {
    return <div className="flex justify-center items-center h-screen">
      <div>Loading your dashboard...</div>
    </div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;