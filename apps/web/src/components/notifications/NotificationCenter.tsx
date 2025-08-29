'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AsciiArt } from '@/components/AsciiArt';
import { BELL_MINI, INFO_MINI, WARNING_MINI } from '@/ascii';
import { 
  SmartNotification, 
  NotificationType, 
  NotificationPriority 
} from '@/lib/notifications/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface NotificationCenterProps {
  userId: string;
}

export function NotificationCenter({ userId }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Mock data - in real app, fetch from API
  useEffect(() => {
    const mockNotifications: SmartNotification[] = [
      {
        id: '1',
        type: NotificationType.PRACTICE_TIME,
        priority: NotificationPriority.MEDIUM,
        channel: 'IN_APP' as any,
        content: {
          title: 'Morning Practice Time',
          body: 'Start your day with intention. Your Monk practice awaits.',
          actionUrl: '/practice/morning',
        },
        scheduledFor: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
        context: {
          reason: 'Morning window',
          userState: { house: 'MONK' },
          triggers: [],
        },
      },
      {
        id: '2',
        type: NotificationType.PEER_ACTIVITY,
        priority: NotificationPriority.LOW,
        channel: 'IN_APP' as any,
        content: {
          title: '5 Monks are practicing now',
          body: 'Join your house in morning practice',
          actionUrl: '/house/live',
        },
        scheduledFor: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        context: {
          reason: 'House activity',
          userState: { house: 'MONK' },
          triggers: [],
        },
      },
    ];
    
    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.length);
  }, []);
  
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.STREAK_RISK:
        return WARNING_MINI;
      case NotificationType.MILESTONE:
      case NotificationType.ACHIEVEMENT_CLOSE:
        return '🏆';
      case NotificationType.PEER_ACTIVITY:
      case NotificationType.HOUSE_EVENT:
        return '👥';
      default:
        return BELL_MINI;
    }
  };
  
  const getPriorityColor = (priority: NotificationPriority) => {
    switch (priority) {
      case NotificationPriority.URGENT:
        return 'text-red-500';
      case NotificationPriority.HIGH:
        return 'text-orange-500';
      case NotificationPriority.MEDIUM:
        return 'text-[var(--accent)]';
      default:
        return 'text-[var(--muted)]';
    }
  };
  
  const handleNotificationClick = (notification: SmartNotification) => {
    if (notification.content.actionUrl) {
      window.location.href = notification.content.actionUrl;
    }
    setIsOpen(false);
  };
  
  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };
  
  return (
    <>
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--accent)] text-[var(--bg)] rounded-full text-xs flex items-center justify-center font-mono"
          >
            {unreadCount}
          </motion.span>
        )}
      </Button>
      
      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 top-12 z-50 w-80 max-h-[80vh] overflow-hidden bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg"
            >
              {/* Header */}
              <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                <h3 className="font-semibold">Notifications</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Notifications List */}
              <div className="overflow-y-auto max-h-[calc(80vh-4rem)]">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-[var(--muted)]">
                    <AsciiArt
                      ascii={`
   ___
  /   \\
 |  -  |
  \\___/
   ...
      `}
                      variant="empty"
                    />
                    <p className="mt-4">No new notifications</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--border)]">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="p-4 hover:bg-[var(--bg)] cursor-pointer transition-colors"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <span className={cn(
                            'text-xl flex-shrink-0',
                            getPriorityColor(notification.priority)
                          )}>
                            {getNotificationIcon(notification.type)}
                          </span>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">
                              {notification.content.title}
                            </p>
                            <p className="text-xs text-[var(--muted)] mt-1">
                              {notification.content.body}
                            </p>
                            <p className="text-xs text-[var(--muted)] mt-2">
                              {formatDistanceToNow(notification.scheduledFor, { addSuffix: true })}
                            </p>
                          </div>
                          
                          {/* Clear button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-6 h-6 opacity-0 hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              clearNotification(notification.id);
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-3 border-t border-[var(--border)]">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setNotifications([]);
                      setUnreadCount(0);
                    }}
                  >
                    Clear all
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// Notification preferences component
export function NotificationPreferences({ userId }: { userId: string }) {
  const [preferences, setPreferences] = useState({
    frequency: 'balanced' as 'minimal' | 'balanced' | 'frequent',
    channels: {
      push: true,
      email: false,
      inApp: true,
    },
    quiet: {
      enabled: true,
      start: '22:00',
      end: '08:00',
    },
    types: {
      practiceReminders: true,
      streakAlerts: true,
      socialUpdates: true,
      achievements: true,
    },
  });
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-4">Notification Settings</h3>
        
        {/* Frequency */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Frequency</label>
            <div className="grid grid-cols-3 gap-2">
              {(['minimal', 'balanced', 'frequent'] as const).map((freq) => (
                <button
                  key={freq}
                  onClick={() => setPreferences(p => ({ ...p, frequency: freq }))}
                  className={cn(
                    'p-3 rounded-lg border transition-colors capitalize',
                    preferences.frequency === freq
                      ? 'border-[var(--accent)] bg-[var(--accent)] bg-opacity-10'
                      : 'border-[var(--border)] hover:border-[var(--muted)]'
                  )}
                >
                  {freq}
                </button>
              ))}
            </div>
          </div>
          
          {/* Quiet Hours */}
          <div>
            <label className="text-sm font-medium mb-2 block">Quiet Hours</label>
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                checked={preferences.quiet.enabled}
                onChange={(e) => 
                  setPreferences(p => ({ 
                    ...p, 
                    quiet: { ...p.quiet, enabled: e.target.checked } 
                  }))
                }
              />
              <span className="text-sm">
                No notifications from {preferences.quiet.start} to {preferences.quiet.end}
              </span>
            </div>
          </div>
          
          {/* Notification Types */}
          <div>
            <label className="text-sm font-medium mb-2 block">Notification Types</label>
            <div className="space-y-2">
              {Object.entries(preferences.types).map(([key, enabled]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) =>
                      setPreferences(p => ({
                        ...p,
                        types: { ...p.types, [key]: e.target.checked },
                      }))
                    }
                  />
                  <span className="text-sm capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}