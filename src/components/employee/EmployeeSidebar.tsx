import React, { useState, useEffect } from 'react';
import { 
  PanelLeftClose, 
  MessageSquarePlus, 
  History, 
  Bell, 
  LogOut, 
  ChevronRight
} from 'lucide-react';
import { useIncident } from '../../context/IncidentContext';
import { Incident } from '../../types';

export interface EmployeeNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'success' | 'info' | 'warning';
  read: boolean;
  ticketId?: string;
}

interface EmployeeSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: 'chat' | 'history' | 'notifications' | 'profile';
  onNavigate: (view: 'chat' | 'history' | 'notifications' | 'profile') => void;
  onNewChat: () => void;
  onSelectTicket?: (ticket: Incident) => void;
}

export const EmployeeSidebar: React.FC<EmployeeSidebarProps> = ({
  isOpen,
  onClose,
  activeView,
  onNavigate,
  onNewChat
}) => {
  const { currentUser, logout } = useIncident();

  // Dynamic notifications for the employee
  const [notifications] = useState<EmployeeNotification[]>([
    {
      id: 'notif-1',
      title: 'AI Auto-Remediation Succeeded',
      message: 'Self-resolution script executed for MTU fragmentation. Incident resolved instantly.',
      timestamp: '15 mins ago',
      type: 'success',
      read: false,
      ticketId: 'TRC-1007'
    },
    {
      id: 'notif-2',
      title: 'Ticket Assigned to Specialist',
      message: 'Faisal Alharbi (Software Specialist) was assigned to TRC-1002.',
      timestamp: '1 hour ago',
      type: 'info',
      read: false,
      ticketId: 'TRC-1002'
    },
    {
      id: 'notif-3',
      title: 'Riyadh DC-1 Gateway Health Alert',
      message: 'Telemetry latency normalized after VIP failover.',
      timestamp: '2 hours ago',
      type: 'info',
      read: true
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);


  return (
    <>
      {/* Dimmed Blur Backdrop Overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      {/* Slide-In Drawer Sidebar */}
      <aside
        aria-label="Employee Navigation Sidebar"
        className={`fixed top-0 left-0 bottom-0 w-80 sm:w-84 max-w-[85vw] bg-[#101828] border-r border-slate-800 z-50 flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-in-out font-sans ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header: Logo + Collapse Toggle */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Secondary Logo with Transparent Background */}
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-transparent">
              <img
                src="/Slogo-transparent.png"
                alt="TRACE Logo"
                className="w-full h-full object-contain filter drop-shadow select-none"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/Slogo.png';
                }}
              />
            </div>
          </div>

          {/* Minimalist Collapse / Close Button */}
          <button
            onClick={onClose}
            type="button"
            title="Collapse Sidebar"
            aria-label="Collapse Sidebar"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer border border-transparent hover:border-slate-700"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Main Navigation Content */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2.5">
          
          {/* 1. New Chat (Top) */}
          <button
            onClick={() => {
              onNewChat();
              onNavigate('chat');
              onClose();
            }}
            type="button"
            className="w-full flex items-center justify-between px-3.5 py-3 rounded-2xl bg-[#80A6D7] hover:bg-[#97bbed] text-[#0F1319] font-bold text-xs shadow-md shadow-[#80A6D7]/15 transition-all cursor-pointer group active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <MessageSquarePlus className="w-4 h-4 text-[#0F1319]" />
              <span>New Chat</span>
            </div>
            <span className="text-[10px] font-mono opacity-80 group-hover:opacity-100">Fresh Session</span>
          </button>

          {/* 2. History (Beneath New Chat) */}
          <button
            onClick={() => {
              onNavigate('history');
              onClose();
            }}
            type="button"
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl border transition-all cursor-pointer text-xs font-medium group active:scale-[0.98] ${
              activeView === 'history'
                ? 'bg-[#1E293B] text-white border-slate-700 shadow-sm'
                : 'bg-[#0F1319] text-slate-300 border-slate-800/80 hover:border-slate-700 hover:text-white hover:bg-[#1E293B]/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <History className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>History</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* 3. Notifications (Beneath History) */}
          <button
            onClick={() => {
              onNavigate('notifications');
              onClose();
            }}
            type="button"
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl border transition-all cursor-pointer text-xs font-medium group active:scale-[0.98] ${
              activeView === 'notifications'
                ? 'bg-[#1E293B] text-white border-slate-700 shadow-sm'
                : 'bg-[#0F1319] text-slate-300 border-slate-800/80 hover:border-slate-700 hover:text-white hover:bg-[#1E293B]/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>Notifications</span>
            </div>
            <div className="flex items-center gap-1.5">
              {unreadCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {unreadCount} new
                </span>
              ) : (
                <span className="text-[10px] font-mono text-slate-500">All read</span>
              )}
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
            </div>
          </button>
        </div>

        {/* Bottom Section: Profile Picture (Rounded Edges, Directs to Profile) & Sign Out Option */}
        <div className="p-3.5 border-t border-slate-800/80 flex items-center justify-between bg-[#0F1319]/40">
          
          {/* Profile Picture Only: Round edges, directs to profile on click */}
          <button
            type="button"
            onClick={() => {
              onNavigate('profile');
              onClose();
            }}
            title={`View Profile (${currentUser.name})`}
            aria-label="View Profile"
            className="relative p-0.5 rounded-full hover:ring-2 hover:ring-[#80A6D7] transition-all cursor-pointer group focus:outline-none"
          >
            <img
              src={currentUser.avatar || '/default.png'}
              alt={currentUser.name}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/default.png';
              }}
              className="w-10 h-10 rounded-full object-cover border border-slate-700 group-hover:border-[#80A6D7] transition-colors shadow-md"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#101828]" />
          </button>

          {/* Clean Sign Out Option */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              logout();
            }}
            title="Sign Out"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/25 active:bg-red-950/40 border border-transparent hover:border-red-900/40 transition-colors cursor-pointer group"
          >
            <LogOut className="w-4 h-4 text-red-400 group-hover:text-red-300 transition-colors" />
            <span>Sign Out</span>
          </button>
        </div>

      </aside>
    </>
  );
};

export default EmployeeSidebar;
