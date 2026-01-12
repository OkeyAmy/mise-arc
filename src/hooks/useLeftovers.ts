import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LeftoverItem } from '@/data/schema';
import { Session, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { toast } from 'sonner';

export const useLeftovers = (session: Session | null) => {
    const [items, setItems] = useState<LeftoverItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchLeftovers = useCallback(async () => {
        if (!session) return;
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('user_leftovers')
                .select('*')
                .eq('user_id', session.user.id)
                .order('date_created', { ascending: false });

            if (error) throw error;
            setItems(data || []);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to fetch leftovers.');
        } finally {
            setIsLoading(false);
        }
    }, [session]);

    useEffect(() => {
        fetchLeftovers();
    }, [fetchLeftovers]);
    
    useEffect(() => {
        if (!session) return;

        const handleDbChange = (payload: RealtimePostgresChangesPayload<LeftoverItem>) => {
            if (payload.errors) {
                console.error("Realtime error:", payload.errors);
                toast.error("Error receiving live updates.");
                return;
            }

            switch (payload.eventType) {
                case 'INSERT':
                    setItems(currentItems => [payload.new, ...currentItems]
                        .sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime()));
                    break;
                case 'UPDATE':
                    setItems(currentItems => currentItems.map(item => 
                        item.id === payload.new.id ? payload.new : item
                    ));
                    break;
                case 'DELETE':
                    const oldId = (payload.old as { id: string }).id;
                    setItems(currentItems => currentItems.filter(item => item.id !== oldId));
                    break;
                default:
                    // This event type is not handled.
                    break;
            }
        };

        const channel = supabase
            .channel('user-leftovers-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'user_leftovers', filter: `user_id=eq.${session.user.id}` },
                handleDbChange
            )
            .subscribe((status, err) => {
                if (err) {
                    console.error("Subscription error", err);
                    toast.error("Could not connect to live updates for leftovers.");
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [session]);

    const addLeftover = async (newItem: Omit<LeftoverItem, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'date_created'> & { date_created?: string }) => {
        if (!session) return;
        try {
            const { data, error } = await supabase
                .from('user_leftovers')
                .insert([{ ...newItem, user_id: session.user.id }])
                .select();
            
            if (error) throw error;
            if (data && data.length > 0) {
                const newLeftover = data[0];
                // Manually update state for immediate feedback, also handled by realtime
                setItems(currentItems => {
                    if (currentItems.some(item => item.id === newLeftover.id)) {
                        return currentItems; // Already added by realtime
                    }
                    return [newLeftover, ...currentItems]
                        .sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime());
                });
                toast.success(`'${newLeftover.meal_name}' added to leftovers.`);
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to add leftover.');
        }
    };

    const updateLeftover = async (id: string, updates: Partial<{ meal_name: string; servings: number; notes: string }>) => {
        if (!session) return;
        try {
            const { data, error } = await supabase
                .from('user_leftovers')
                .update(updates)
                .eq('id', id)
                .select();
            
            if (error) throw error;
            if (data && data.length > 0) {
                const updatedItem = data[0];
                // Manually update state for immediate feedback
                setItems(currentItems => currentItems.map(item => 
                    item.id === updatedItem.id ? updatedItem : item
                ));
                toast.success('Leftover updated.');
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update leftover.');
        }
    };
    
    const removeLeftover = async (id: string) => {
        if (!session) return;
        try {
            const { error } = await supabase
                .from('user_leftovers')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            // Manually update state for immediate feedback
            setItems(currentItems => currentItems.filter(item => item.id !== id));
            toast.success('Leftover removed.');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to remove leftover.');
        }
    };

    return { items, isLoading, addLeftover, updateLeftover, removeLeftover, getLeftovers: fetchLeftovers };
};
