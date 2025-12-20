import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';

export function usePushNotifications() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Check if Web Notifications are supported
    const supported = 'Notification' in window;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
      
      // Check if already subscribed (stored in localStorage)
      const savedSubscription = localStorage.getItem('webNotificationsEnabled');
      if (savedSubscription === 'true' && Notification.permission === 'granted') {
        setIsSubscribed(true);
      }
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      toast({
        title: 'Not Supported',
        description: 'Web notifications are not supported on this device/browser.',
        variant: 'destructive'
      });
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        return true;
      } else if (result === 'denied') {
        toast({
          title: 'Notifications Blocked',
          description: 'Please enable notifications in your browser settings.',
          variant: 'destructive'
        });
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !user) return false;

    try {
      // Request permission if not already granted
      if (Notification.permission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) return false;
      }

      // Store subscription state
      localStorage.setItem('webNotificationsEnabled', 'true');
      setIsSubscribed(true);
      
      // Show a test notification to confirm it works
      showLocalNotification('$ongChainn Notifications Enabled', {
        body: 'You will now receive notifications for likes, comments, and follows.',
        icon: '/favicon.png',
        tag: 'subscription-confirmation'
      });
      
      toast({
        title: 'Subscribed!',
        description: 'You will receive notifications for activity on your posts.'
      });
      
      return true;
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      toast({
        title: 'Subscription Failed',
        description: 'Could not enable notifications.',
        variant: 'destructive'
      });
      return false;
    }
  }, [isSupported, user, requestPermission]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    try {
      localStorage.removeItem('webNotificationsEnabled');
      setIsSubscribed(false);
      
      toast({
        title: 'Unsubscribed',
        description: 'You will no longer receive notifications.'
      });
      
      return true;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      return false;
    }
  }, []);

  const showLocalNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permission === 'granted') {
      try {
        const notification = new Notification(title, {
          icon: '/favicon.png',
          badge: '/favicon.png',
          requireInteraction: false,
          ...options
        });

        // Auto-close after 5 seconds
        setTimeout(() => notification.close(), 5000);

        // Handle notification click
        notification.onclick = () => {
          window.focus();
          notification.close();
          if (options?.data?.url) {
            window.location.href = options.data.url;
          }
        };

        return notification;
      } catch (error) {
        // Fallback to toast if notification fails
        toast({
          title,
          description: options?.body
        });
      }
    } else {
      // Fallback to toast when permission not granted
      toast({
        title,
        description: options?.body
      });
    }
  }, [permission]);

  return {
    isSupported,
    isSubscribed,
    permission,
    requestPermission,
    subscribe,
    unsubscribe,
    showLocalNotification
  };
}
