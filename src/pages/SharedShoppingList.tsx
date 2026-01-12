
import React, { useState, useEffect } from "react";
import { SharedShoppingListImport } from "@/components/SharedShoppingListImport";
import { useShoppingList } from "@/hooks/useShoppingList";
import { Session } from "@supabase/supabase-js";
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export const SharedShoppingListPage = () => {
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();
  const { addItems } = useShoppingList(session, "default");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleTriggerAIResponse = (message: string) => {
    // Store the AI message in localStorage to be picked up by the main app
    localStorage.setItem('pendingAIMessage', message);
    // Navigate to the main app
    navigate('/');
  };

  return (
    <SharedShoppingListImport
      session={session}
      onAddItems={addItems}
      onTriggerAIResponse={handleTriggerAIResponse}
    />
  );
};
