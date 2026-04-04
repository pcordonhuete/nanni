"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, X, FileText, AlertTriangle, Brain, Clock, type LucideIcon } from "lucide-react";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/actions";
import { timeAgo } from "@/lib/utils";
import type { Notification } from "@/lib/types";
import Link from "next/link";

interface NotificationPanelProps {
  notifications: Notification[];
  unreadCount: number;
}

const typeIcons: Record<string, LucideIcon> = {
  new_record: FileText,
  family_inactive: AlertTriangle,
  insight: Brain,
  reminder: Clock,
  system: Bell,
};

export function NotificationPanel({ notifications, unreadCount }: NotificationPanelProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-400 hover:text-gray-600 transition rounded-lg hover:bg-gray-100"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center min-w-[18px] h-[18px]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 lg:bottom-full lg:top-auto lg:left-0 lg:right-auto lg:mb-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
          <div className="flex items-center justify-between p-4 border-b border-gray-50">
            <h3 className="font-bold text-gray-900 text-sm">Notificaciones</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllNotificationsRead()}
                className="text-[11px] text-nanni-600 hover:text-nanni-700 font-medium flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Marcar todas leídas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Sin notificaciones</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 hover:bg-gray-50 transition cursor-pointer ${!n.is_read ? "bg-nanni-50/30" : ""}`}
                  onClick={() => {
                    if (!n.is_read) markNotificationRead(n.id);
                    if (n.link) window.location.href = n.link;
                    setOpen(false);
                  }}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-nanni-50 flex items-center justify-center shrink-0 mt-0.5">
                      {(() => { const Icon = typeIcons[n.type] || Bell; return <Icon className="w-3.5 h-3.5 text-nanni-600" />; })()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs leading-relaxed ${!n.is_read ? "text-gray-900 font-medium" : "text-gray-600"}`}>
                        {n.title}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {timeAgo(n.created_at)}
                      </p>
                    </div>
                    {!n.is_read && (
                      <div className="w-2 h-2 rounded-full bg-nanni-500 shrink-0 mt-1.5" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
