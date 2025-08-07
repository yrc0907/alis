"use client";

import { useState, useEffect } from 'react';
import {
  Users,
  BarChart2,
  Settings,
  Globe,
  Database,
  Bell,
  BarChartHorizontal,
  MessageCircle,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { SidebarItem } from './SidebarItem';
import { Logo } from './Logo';

const sidebarItems = [
  { icon: BarChart2, text: '主页', alert: false, href: '/dashboard' },

  {
    icon: Bell,
    text: '预约管理',
    alert: 'appointments', // 特殊标识，用于动态获取数量
    href: '/dashboard/appointments',
  },
  {
    icon: MessageCircle,
    text: '用户聊天',
    alert: 'chats', // 特殊标识，用于动态获取未读聊天数量
    href: '/dashboard/chats',
  },
  {
    icon: BarChartHorizontal,
    text: '兴趣分析',
    alert: false,
    href: '/dashboard/interests',
  },
  {
    icon: Database,
    text: '知识库管理',
    alert: false,
    href: '/dashboard/knowledge',
  },
  { icon: Users, text: '潜在用户', alert: false, href: '/dashboard/potential-users' },
  { icon: Settings, text: '设置', alert: false, href: '/dashboard/settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(true);
  const [unreadAppointments, setUnreadAppointments] = useState(0);
  const [unreadChats, setUnreadChats] = useState(0);

  // 获取未读预约数量
  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/appointments/unread-count');
      if (response.ok) {
        const data = await response.json();
        setUnreadAppointments(data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch unread appointment count:', error);
    }
  };

  // 获取未读聊天数量
  const fetchUnreadChats = async () => {
    try {
      const response = await fetch('/api/chats/unread-count');
      if (response.ok) {
        const data = await response.json();
        setUnreadChats(data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch unread chat count:', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount(); // 初始加载
    fetchUnreadChats(); // 加载未读聊天数

    // 设置定时器轮询，例如每30秒一次
    const appointmentInterval = setInterval(fetchUnreadCount, 30000);
    const chatInterval = setInterval(fetchUnreadChats, 30000);

    return () => {
      clearInterval(appointmentInterval); // 组件卸载时清除定时器
      clearInterval(chatInterval);
    }
  }, []);

  return (
    <aside
      className={`h-screen transition-all duration-300 ${expanded ? 'w-64' : 'w-20'
        } bg-white border-r shadow-sm flex flex-col`}
    >
      <div className="p-4 pb-2 flex justify-between items-center">
        <Logo showText={expanded} />
        <button
          onClick={() => setExpanded((curr) => !curr)}
          className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100"
        >
          {expanded ? '<' : '>'}
        </button>
      </div>

      <ul className="flex-1 px-3">
        {sidebarItems.map((item, index) => {
          let alertValue = false;
          if (item.alert === 'appointments') {
            alertValue = unreadAppointments > 0;
          } else if (item.alert === 'chats') {
            alertValue = unreadChats > 0;
          } else if (typeof item.alert === 'boolean') {
            alertValue = item.alert;
          }

          return (
            <SidebarItem
              key={index}
              icon={<item.icon />}
              text={item.text}
              active={pathname === item.href || pathname.startsWith(item.href + '/')}
              alert={alertValue}
              expanded={expanded}
              href={item.href}
            />
          );
        })}
      </ul>

      <div className="border-t flex p-3">
        <div
          className={`
              flex justify-between items-center
              overflow-hidden transition-all ${expanded ? 'w-52 ml-3' : 'w-0'}
          `}
        >
          <div className="leading-4">
            <h4 className="font-semibold">John Doe</h4>
            <span className="text-xs text-gray-600">johndoe@gmail.com</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
