
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

export type UserRole = 'admin' | 'user';

export interface UserRoleData {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

export function useUserRoles(session: Session | null) {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (session?.user.id) {
      fetchUserRoles();
    }
  }, [session]);

  const fetchUserRoles = async () => {
    if (!session?.user.id) return;
    
    setIsLoading(true);
    try {
      // Since user_roles table doesn't exist in the current schema,
      // we'll use a function to get user roles if it exists
      const { data, error } = await supabase.rpc('get_user_roles', {
        p_user_id: session.user.id
      });

      if (error) {
        console.error('Error fetching user roles:', error);
        // Fallback: assume user role for now
        setUserRoles(['user']);
      } else {
        const roles = data?.map((item: any) => item.role as UserRole) || ['user'];
        setUserRoles(roles);
      }
    } catch (error) {
      console.error('Error fetching user roles:', error);
      // Fallback: assume user role for now
      setUserRoles(['user']);
    } finally {
      setIsLoading(false);
    }
  };

  const hasRole = (role: UserRole): boolean => {
    return userRoles.includes(role);
  };

  const isAdmin = (): boolean => {
    return hasRole('admin');
  };

  return {
    userRoles,
    isLoading,
    hasRole,
    isAdmin,
    refetch: fetchUserRoles
  };
}
