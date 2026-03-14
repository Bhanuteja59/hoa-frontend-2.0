import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'payment' | 'document' | 'announcement' | 'system';
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export function useNotifications() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [ws, setWs] = useState<WebSocket | null>(null);

  // Fetch history
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => apiFetch('/notifications'),
    enabled: !!session,
    refetchInterval: 60000, // Fallback polling every minute
  });

  // Fetch unread count
  const { data: unreadData } = useQuery<{ unread_count: number }>({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => apiFetch('/notifications/unread-count'),
    enabled: !!session,
  });

  const markAsRead = useMutation({
    mutationFn: (args: { ids?: string[], all?: boolean }) => 
      apiFetch('/notifications/read', {
        method: 'POST',
        body: JSON.stringify({ notification_ids: args.ids, all: args.all })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  // WebSocket Setup
  useEffect(() => {
    // @ts-ignore
    if (!session?.user?.id) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use the same host as API_BASE but swap protocol
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000/api/v1';
    const wsUrl = apiBaseUrl.replace(/^http/, 'ws') + `/notifications/ws/${(session.user as any).id}`;

    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('Notification WebSocket connected');
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'NOTIFICATION') {
          const newNotif = payload.data;
          
          // Show toast
          toast({
            title: newNotif.title,
            description: newNotif.message,
          });

          // Invalidate query to refresh list
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      } catch (err) {
        console.error('Error parsing WS message', err);
      }
    };

    socket.onclose = () => {
      console.log('Notification WebSocket disconnected');
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [session, queryClient]);

  return {
    notifications,
    unreadCount: unreadData?.unread_count || 0,
    isLoading,
    markAsRead: (ids?: string[]) => markAsRead.mutate({ ids }),
    markAllAsRead: () => markAsRead.mutate({ all: true }),
  };
}
