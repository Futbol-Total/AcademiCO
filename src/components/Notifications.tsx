import { useEffect, useState } from "react";
import { Bell, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  course_id: string | null;
  is_read: boolean;
  created_at: string;
}

export const Notifications = ({ userId }: { userId: string }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [setupComplete, setSetupComplete] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setupNotificationsSystem();
  }, []);

  useEffect(() => {
    if (setupComplete) {
      fetchNotifications();
      subscribeToNotifications();
    }
  }, [userId, setupComplete]);

  const setupNotificationsSystem = async () => {
    try {
      // Call setup function to create tables and triggers
      const { error } = await supabase.functions.invoke("setup-notifications");
      
      if (error) {
        console.error("Error setting up notifications:", error);
      }
      
      setSetupComplete(true);
    } catch (error: any) {
      console.error("Error calling setup function:", error);
      // Continue anyway, table might already exist
      setSetupComplete(true);
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Error fetching notifications:", error);
        return;
      }

      // Map the data to match our interface, handling both is_read and read fields
      const mappedData = (data || []).map((item: any) => ({
        id: item.id,
        title: item.title || "Notificación",
        message: item.message,
        type: item.type || "info",
        course_id: item.course_id || null,
        is_read: item.is_read ?? item.read ?? false,
        created_at: item.created_at,
      })) as Notification[];

      setNotifications(mappedData);
      setUnreadCount(mappedData.filter((n) => !n.is_read).length);
    } catch (error: any) {
      console.error("Error al cargar notificaciones:", error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToNotifications = () => {
    const channel = supabase
      .channel("notifications-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);
          
          // Show toast notification
          toast.success(newNotification.title, {
            description: newNotification.message,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // Try both field names for compatibility
      const updateData: any = { is_read: true };
      
      const { error } = await supabase
        .from("notifications")
        .update(updateData)
        .eq("id", notificationId);

      if (error) {
        console.error("Error marking as read:", error);
        return;
      }

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error: any) {
      console.error("Error al marcar como leída:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
      
      if (unreadIds.length === 0) return;

      const updateData: any = { is_read: true };

      const { error } = await supabase
        .from("notifications")
        .update(updateData)
        .in("id", unreadIds);

      if (error) {
        console.error("Error marking all as read:", error);
        return;
      }

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success("Todas las notificaciones marcadas como leídas");
    } catch (error: any) {
      console.error("Error al marcar todas como leídas:", error);
      toast.error("Error al actualizar notificaciones");
    }
  };

  const deleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId);

      if (error) throw error;

      const wasUnread = notifications.find((n) => n.id === notificationId)?.is_read === false;
      
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error: any) {
      console.error("Error al eliminar notificación:", error);
      toast.error("Error al eliminar notificación");
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    
    if (notification.course_id) {
      navigate(`/course/${notification.course_id}`);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return "✅";
      case "warning":
        return "⚠️";
      case "error":
        return "❌";
      default:
        return "ℹ️";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificaciones</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-auto p-1 text-xs"
            >
              <Check className="h-3 w-3 mr-1" />
              Marcar todas
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {loading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Cargando...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No hay notificaciones
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start p-3 cursor-pointer ${
                  !notification.is_read ? "bg-primary/5" : ""
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start justify-between w-full gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{getNotificationIcon(notification.type)}</span>
                      <p className="font-medium text-sm truncate">
                        {notification.title}
                      </p>
                      {!notification.is_read && (
                        <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0"
                    onClick={(e) => deleteNotification(notification.id, e)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
