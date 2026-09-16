import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import pb from '@/lib/pocketbaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(pb.authStore.record);

    useEffect(() => pb.authStore.onChange((_token, record) => setUser(record)), []);

    const role = user?.role || '';
    const isAdmin = role === 'Admin';
    const activo = user ? user.activo !== false : false;

    const value = useMemo(
        () => ({
            user,
            role,
            isAdmin,
            activo,
            isAuthed: pb.authStore.isValid && activo,
            login: (email, password) => pb.collection('users').authWithPassword(email, password),
            signup: async (email, password, extraFields = {}) => {
                await pb.collection('users').create({ email, password, passwordConfirm: password, ...extraFields });
                return pb.collection('users').authWithPassword(email, password);
            },
            logout: () => pb.authStore.clear(),
        }),
        [user, role, isAdmin, activo],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
