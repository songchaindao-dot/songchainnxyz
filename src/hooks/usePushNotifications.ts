import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';

const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

export function usePushNotifications() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'prompt'>('default');
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  const isNativePlatform = Capacitor.isNativePlatform();

  useEffect(() => {
    const checkSupport = async () => {
      if (isNativePlatform) {
        // Native mobile - use Capacitor Push Notifications
        setIsSupported(true);
        
        // Check if already registered
        const savedToken = localStorage.getItem('fcmToken');
        if (savedToken) {
          setFcmToken(savedToken);
          setIsSubscribed(true);
          setPermission('granted');
        }
      } else {
        // Web - use Web Push API
        const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
        setIsSupported(supported);
        
        if (supported) {
          setPermission(Notification.permission);
          
          // Check existing subscription
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            const subscription = await registration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
          }
        }
      }
    };

    checkSupport();
  }, [isNativePlatform]);

  // Set up Capacitor Push Notification listeners
  useEffect(() => {
    if (!isNativePlatform) return;

    // Handle registration success
    const registrationListener = PushNotifications.addListener('registration', (token: Token) => {
      console.log('Push registration success, token:', token.value);
      setFcmToken(token.value);
      localStorage.setItem('fcmToken', token.value);
      setIsSubscribed(true);
      setPermission('granted');
      
      toast({
        title: 'Notifications Enabled',
        description: 'You will now receive push notifications.'
      });
    });

    // Handle registration error
    const registrationErrorListener = PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error);
      toast({
        title: 'Notification Setup Failed',
        description: 'Could not enable push notifications.',
        variant: 'destructive'
      });
    });

    // Handle received notification when app is in foreground
    const receivedListener = PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Push notification received:', notification);
      
      // Show a toast for foreground notifications
      toast({
        title: notification.title || '$ongChainn',
        description: notification.body || 'You have a new notification'
      });
    });

    // Handle notification tap
    const actionListener = PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      console.log('Push notification action performed:', action);
      
      // Navigate based on notification data
      const data = action.notification.data;
      if (data?.url) {
        window.location.href = data.url;
      }
    });

    return () => {
      registrationListener.then(l => l.remove());
      registrationErrorListener.then(l => l.remove());
      receivedListener.then(l => l.remove());
      actionListener.then(l => l.remove());
    };
  }, [isNativePlatform]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      toast({
        title: 'Not Supported',
        description: 'Push notifications are not supported on this device.',
        variant: 'destructive'
      });
      return false;
    }

    try {
      if (isNativePlatform) {
        // Request permission on native platform
        const result = await PushNotifications.requestPermissions();
        
        if (result.receive === 'granted') {
          setPermission('granted');
          return true;
        } else {
          setPermission('denied');
          toast({
            title: 'Notifications Blocked',
            description: 'Please enable notifications in your device settings.',
            variant: 'destructive'
          });
          return false;
        }
      } else {
        // Web browser permission
        const result = await Notification.requestPermission();
        setPermission(result);
        
        if (result === 'granted') {
          toast({
            title: 'Notifications Enabled',
            description: 'You will now receive push notifications.'
          });
          return true;
        } else if (result === 'denied') {
          toast({
            title: 'Notifications Blocked',
            description: 'Please enable notifications in your browser settings.',
            variant: 'destructive'
          });
        }
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported, isNativePlatform]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !user) return false;

    try {
      if (isNativePlatform) {
        // Check and request permission first
        const permResult = await PushNotifications.checkPermissions();
        
        if (permResult.receive !== 'granted') {
          const granted = await requestPermission();
          if (!granted) return false;
        }
        
        // Register for push notifications
        await PushNotifications.register();
        return true;
      } else {
        // Web Push subscription
        let registration = await navigator.serviceWorker.getRegistration();
        
        if (!registration) {
          registration = await navigator.serviceWorker.register('/sw.js');
          await navigator.serviceWorker.ready;
        }

        if (Notification.permission !== 'granted') {
          const granted = await requestPermission();
          if (!granted) return false;
        }

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });

        localStorage.setItem('pushSubscription', JSON.stringify(subscription));
        setIsSubscribed(true);
        
        toast({
          title: 'Subscribed!',
          description: 'You will receive notifications for likes, comments, and follows.'
        });
        
        return true;
      }
    } catch (error) {
      console.error('Error subscribing to push:', error);
      toast({
        title: 'Subscription Failed',
        description: 'Could not subscribe to notifications.',
        variant: 'destructive'
      });
      return false;
    }
  }, [isSupported, user, requestPermission, isNativePlatform]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    try {
      if (isNativePlatform) {
        // Unregister from Capacitor push
        await PushNotifications.removeAllListeners();
        localStorage.removeItem('fcmToken');
        setFcmToken(null);
      } else {
        // Web push unsubscribe
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            await subscription.unsubscribe();
          }
        }
        localStorage.removeItem('pushSubscription');
      }
      
      setIsSubscribed(false);
      
      toast({
        title: 'Unsubscribed',
        description: 'You will no longer receive push notifications.'
      });
      
      return true;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      return false;
    }
  }, [isNativePlatform]);

  const showLocalNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (isNativePlatform) {
      // On native, we can't show local notifications with just PushNotifications
      // Would need @capacitor/local-notifications for that
      toast({
        title,
        description: options?.body
      });
    } else if (permission === 'granted') {
      new Notification(title, {
        icon: '/favicon.png',
        badge: '/favicon.png',
        ...options
      });
    }
  }, [permission, isNativePlatform]);

  return {
    isSupported,
    isSubscribed,
    permission,
    fcmToken,
    isNativePlatform,
    requestPermission,
    subscribe,
    unsubscribe,
    showLocalNotification
  };
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}
