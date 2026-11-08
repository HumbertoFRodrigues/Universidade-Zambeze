import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

const DefaultFallback = () => (
    <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
    </div>
);

export default function ProtectedRoute({ fallback = <DefaultFallback />, unauthenticatedElement }) {
    const { isAuthenticated, isLoadingAuth, authChecked, authError, checkUserAuth } = useAuth();
    console.log('🔥 ProtectedRoute render:', {
        isAuthenticated,
        isLoadingAuth,
        authChecked,
        authError,
    });

    useEffect(() => {
        console.log('🔥 ProtectedRoute useEffect — authChecked:', authChecked, 'isLoadingAuth:', isLoadingAuth);
        if (!authChecked && !isLoadingAuth) {
            console.log('🔥 ProtectedRoute — chamando checkUserAuth()');
            checkUserAuth();
        }
    }, [authChecked, isLoadingAuth, checkUserAuth]);

    if (isLoadingAuth || !authChecked) {
        return fallback;
    }

    if (authError) {
        if (authError.type === 'user_not_registered') {
            return <UserNotRegisteredError />;
        }
        return unauthenticatedElement;
    }

    if (!isAuthenticated) {
        return unauthenticatedElement;
    }

    return <Outlet />;
}
