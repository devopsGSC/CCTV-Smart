import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const ProtectedRoute = ({ children, redirectTo = '/login', roles }) => {
    const { isAuthed, isAdmin } = useAuth();
    const location = useLocation();

    if (!isAuthed) {
        return <Navigate to={redirectTo} replace state={{ from: location.pathname }} />;
    }

    if (roles && !roles.includes(isAdmin ? 'Admin' : 'Usuario')) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;

export { ProtectedRoute };
