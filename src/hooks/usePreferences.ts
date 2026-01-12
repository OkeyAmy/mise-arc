
import { useState, useEffect, useCallback } from "react";
import { UserPreferences } from "@/data/schema";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

export const usePreferences = (userSession: Session | null) => {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPreferences = useCallback(async () => {
    if (!userSession) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", userSession.user.id)
        .single();
      
      if (error && error.code === 'PGRST116') {
        // No preferences found, create initial ones
        await createInitialPreferences(userSession.user.id);
      } else if (error) {
        console.error("Error fetching preferences:", error);
      } else if (data) {
        setPreferences(data as any);
      }
    } catch (err) {
      console.error("Unexpected error in fetchPreferences:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userSession]);

  const createInitialPreferences = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .insert({ user_id: userId })
        .select()
        .single();
      if (error) throw error;
      if (data) {
        setPreferences(data as any);
      }
    } catch (err) {
      console.error("Error creating initial preferences:", err);
    }
  };

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!userSession) return;
    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .update(updates)
        .eq("user_id", userSession.user.id)
        .select()
        .single();
      if (error) throw error;
      if (data) {
        setPreferences(data as any);
      }
    } catch (err) {
      console.error("Error updating preferences:", err);
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return { preferences, isLoading, updatePreferences };
};
