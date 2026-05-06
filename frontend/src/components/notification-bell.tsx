'use client';

import React, { useState } from 'react';
import { Bell, Check, Loader2, X, Info, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { useNotifications } from './notification-provider';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDistanceToNow } from 'date-fns';

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'assignment_due': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'new_content': return <FileText className="h-4 w-4 text-blue-500" />;
      case 'request_answered': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'placement': return <Info className="h-4 w-4 text-purple-500" />;
      default: return <Bell className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger 
        render={
          <Button variant="ghost" size="icon" className="relative rounded-xl hover:bg-slate-100">
            <Bell className="h-5 w-5 text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
        }
      />
      <PopoverContent className="w-80 p-0 rounded-2xl border-0 shadow-xl overflow-hidden" align="end">
        <div className="flex items-center justify-between p-4 bg-white border-b border-slate-50">
          <h3 className="font-bold text-slate-900">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg px-2"
              onClick={() => markAllAsRead()}
            >
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-10 opacity-40">
              <Bell className="h-10 w-10 mb-2" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-4 flex gap-3 group transition-colors ${!notif.is_read ? 'bg-blue-50/50' : 'bg-white'} hover:bg-slate-50`}
                >
                  <div className="mt-1">
                    {getTypeIcon(notif.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className={`text-sm leading-snug ${!notif.is_read ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {!notif.is_read && (
                    <button 
                      onClick={() => markAsRead(notif.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white rounded-lg transition-all"
                    >
                      <Check className="h-4 w-4 text-blue-600" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
          <button className="text-xs font-bold text-slate-500 hover:text-slate-700">
            View All Activity
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
