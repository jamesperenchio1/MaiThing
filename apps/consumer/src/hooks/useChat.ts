import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/auth';
import { supabase } from '../lib/supabase';
import type { Tables, TablesInsert } from '@maithing/shared';

export type ChatThread = {
  id: string;
  buyer_id: string;
  location_id: string;
  order_id: string | null;
  last_message_at: string;
  location_name: string;
  last_message: Tables<'chat_messages'> | null;
  unread_count: number;
};

type ChatMessageRow = Tables<'chat_messages'>;

export function useChatThreads() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const query = useQuery<ChatThread[]>({
    queryKey: ['chat_threads'],
    queryFn: async () => {
      if (!user) return [];

      const { data: threads, error: threadsError } = await supabase
        .from('chat_threads')
        .select('*, location:locations(name)')
        .eq('buyer_id', user.id)
        .order('last_message_at', { ascending: false });
      if (threadsError) throw threadsError;

      const threadIds = (threads ?? []).map((t) => t.id);

      let messages: ChatMessageRow[] = [];
      if (threadIds.length > 0) {
        const { data: msgs, error: msgsError } = await supabase
          .from('chat_messages')
          .select('*')
          .in('thread_id', threadIds)
          .order('created_at', { ascending: true });
        if (msgsError) throw msgsError;
        messages = msgs ?? [];
      }

      const messagesByThread = new Map<string, ChatMessageRow[]>();
      for (const m of messages) {
        const list = messagesByThread.get(m.thread_id) ?? [];
        list.push(m);
        messagesByThread.set(m.thread_id, list);
      }

      return (threads ?? []).map((t) => {
        const raw = t as unknown as {
          id: string;
          buyer_id: string;
          location_id: string;
          order_id: string | null;
          last_message_at: string;
          location: { name: string } | null;
        };
        const threadMessages = messagesByThread.get(raw.id) ?? [];
        const lastMessage = threadMessages[threadMessages.length - 1] ?? null;
        const unreadCount = threadMessages.filter(
          (m) => m.sender_id !== user.id && m.read_at === null,
        ).length;
        return {
          id: raw.id,
          buyer_id: raw.buyer_id,
          location_id: raw.location_id,
          order_id: raw.order_id,
          last_message_at: raw.last_message_at,
          location_name: raw.location?.name ?? '—',
          last_message: lastMessage,
          unread_count: unreadCount,
        };
      });
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!user) return;

    const threadIds = (query.data ?? []).map((t) => t.id);
    const channel = supabase.channel(`chat-threads-${user.id}`);

    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'chat_threads',
        filter: `buyer_id=eq.${user.id}`,
      },
      () => {
        void queryClient.invalidateQueries({ queryKey: ['chat_threads'] });
      },
    );

    if (threadIds.length > 0) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `thread_id=in.(${threadIds.join(',')})`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['chat_threads'] });
        },
      );
    }

    void channel.subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, queryClient, query.data]);

  return query;
}

export function useChatMessages(threadId: string) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const query = useQuery<ChatMessageRow[]>({
    queryKey: ['chat_messages', threadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user && !!threadId,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`chat-messages-${threadId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `thread_id=eq.${threadId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['chat_messages', threadId] });
          void queryClient.invalidateQueries({ queryKey: ['chat_threads'] });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [threadId, user, queryClient]);

  useEffect(() => {
    if (!user || !query.data) return;

    const unreadIds = query.data
      .filter((m) => m.sender_id !== user.id && m.read_at === null)
      .map((m) => m.id);

    if (unreadIds.length === 0) return;

    void supabase
      .from('chat_messages')
      .update({ read_at: new Date().toISOString() })
      .in('id', unreadIds);
  }, [query.data, user]);

  return query;
}

export function useCreateThread() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async ({ locationId, orderId }: { locationId: string; orderId?: string }) => {
      if (!user) throw new Error('Not signed in');

      const { data: existing, error: selectError } = await supabase
        .from('chat_threads')
        .select('id')
        .eq('buyer_id', user.id)
        .eq('location_id', locationId)
        .maybeSingle();
      if (selectError) throw selectError;

      if (existing?.id) return existing.id;

      const insertValues: TablesInsert<'chat_threads'> = {
        buyer_id: user.id,
        location_id: locationId,
        order_id: orderId ?? null,
        last_message_at: new Date().toISOString(),
      };

      const { data: inserted, error: insertError } = await supabase
        .from('chat_threads')
        .insert(insertValues)
        .select('id')
        .single();
      if (insertError) throw insertError;

      return inserted.id;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['chat_threads'] });
    },
  });
}

export function useSendMessage(threadId: string) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (body: string) => {
      if (!user) throw new Error('Not signed in');
      if (!body.trim()) throw new Error('Message cannot be empty');

      const { error } = await supabase.from('chat_messages').insert({
        thread_id: threadId,
        sender_id: user.id,
        body: body.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['chat_messages', threadId] });
      void queryClient.invalidateQueries({ queryKey: ['chat_threads'] });
    },
  });
}

export function useHasUnreadMessages() {
  const { data: threads = [] } = useChatThreads();
  return threads.some((t) => t.unread_count > 0);
}
