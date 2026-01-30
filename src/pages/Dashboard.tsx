import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import TeacherDashboard from '@/components/dashboard/TeacherDashboard';
import BossDashboard from '@/components/dashboard/BossDashboard';
import ParentDashboard from '@/components/dashboard/ParentDashboard';

export default function Dashboard() {
  const { session, profile, loading } = useAuth();

  // If loading is true (initial load), show spinner
  // If session exists but profile is null, it means we are fetching profile, show spinner
  if (loading || (session && !profile)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  // If no session (and not loading), redirect to login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // If session exists and profile is loaded, show dashboard based on role
  if (profile) {
    switch (profile.role) {
      case 'teacher':
        return <TeacherDashboard />;
      case 'boss':
        return <BossDashboard />;
      case 'parent':
        return <ParentDashboard />;
      default:
        // Fallback for unknown role, or maybe just show ParentDashboard?
        return <ParentDashboard />;
    }
  }
  
  // Fallback (should not reach here)
  return <Navigate to="/login" replace />;
}
