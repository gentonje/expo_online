import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type AuthContextType = {
    session: Session | null;
    user: User | null;
    isLoading: boolean;
    isAdmin: boolean;
    isSuperAdmin: boolean;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    isLoading: true,
    isAdmin: false,
    isSuperAdmin: false,
    signOut: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                checkUserRoles(session.user.id);
            } else {
                setIsLoading(false);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                checkUserRoles(session.user.id);
            } else {
                setIsAdmin(false);
                setIsSuperAdmin(false);
                setIsLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const checkUserRoles = async (userId: string) => {
        try {
            // Check admin status
            const { data: adminData } = await supabase.rpc('is_admin', { user_id: userId });
            setIsAdmin(!!adminData);

            // Check super admin status
            const { data: superAdminData } = await supabase.rpc('is_super_admin', { user_id: userId });
            setIsSuperAdmin(!!superAdminData);
        } catch (error) {
            console.error('Error checking roles:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ session, user, isLoading, isAdmin, isSuperAdmin, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
