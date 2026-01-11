import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
}

export function ProtectedRoute({ 
  children, 
  allowedRoles,
  requireAuth = true 
}: ProtectedRouteProps) {
  const { user, loading, role } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se requer autenticação e usuário não está logado
  if (requireAuth && !user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Se há roles permitidas e o usuário não tem a role correta
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // Redirecionar baseado no role atual
    if (role === 'super_user') {
      return <Navigate to="/admin" replace />;
    } else if (role === 'master') {
      return <Navigate to="/painel" replace />;
    } else if (role === 'usuario') {
      return <Navigate to="/" replace />;
    } else {
      return <Navigate to="/auth" replace />;
    }
  }

  return <>{children}</>;
}

// Componente específico para Super User
export function SuperUserRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['super_user']}>
      {children}
    </ProtectedRoute>
  );
}

// Componente específico para Master
export function MasterRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['super_user', 'master']}>
      {children}
    </ProtectedRoute>
  );
}

// Componente para usuários autenticados (qualquer role)
export function AuthenticatedRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['super_user', 'master', 'usuario']}>
      {children}
    </ProtectedRoute>
  );
}
