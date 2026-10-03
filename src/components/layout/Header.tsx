import React from 'react';
import { useIncident } from '../../context/IncidentContext';
import { 
  Layers, 
  Archive, 
  BarChart3 
} from 'lucide-react';

interface HeaderProps {
  currentView: 'dashboard' | 'intelligence' | 'memory' | 'employee' | 'manager' | 'denied';
  onNavigate: (view: 'dashboard' | 'intelligence' | 'memory' | 'employee' | 'manager' | 'denied') => void;
  onToggleSidebar?: () => void;
  onToggleEmployeeSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  currentView, 
  onNavigate, 
  onToggleSidebar, 
  onToggleEmployeeSidebar 
}) => {
  const { 
    currentRole, 
    incidents
  } = useIncident();

  const isEmployee = currentRole === 'employee';
  const isMember = currentRole === 'technician' || currentRole === 'it_member';
  const isHead = currentRole === 'manager' || currentRole === 'it_head';

  const criticalCount = incidents.filter(i => i.priority === 'CRITICAL' && i.status !== 'Resolved' && i.status !== 'Resolved by AI').length;

  const getHomeView = (): 'employee' | 'dashboard' | 'manager' => {
    if (isEmployee) return 'employee';
    if (isHead) return 'manager';
    return 'dashboard';
  };

  const handleSidebarToggle = onToggleSidebar || onToggleEmployeeSidebar;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#0F1319]/95 backdrop-blur-xl">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left Branding with uploaded Slogo.png */}
        <div className="flex items-center gap-3 sm:gap-6">
          <div 
            onClick={() => {
              if ((isEmployee || isMember) && handleSidebarToggle) {
                handleSidebarToggle();
              } else {
                onNavigate(getHomeView());
              }
            }}
            className="flex items-center cursor-pointer group"
            title={isEmployee || isMember ? "Toggle Navigation Menu" : "TRACE Home"}
          >
            {/* Logo container embedding Slogo.png without green dot */}
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-[#101828] border border-slate-700/80 group-hover:border-slate-500 transition-colors p-1.5 shadow-sm">
              <img 
                src="/Slogo.png" 
                alt="TRACE Logo" 
                className="w-full h-full object-contain filter drop-shadow"
                onError={(e) => {
                  // Fallback if image fails
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          </div>

          {/* Navigation Links strictly bound to user's database role */}
          <nav className="hidden md:flex items-center gap-1 ml-4 border-l border-slate-800/80 pl-6">
            {isEmployee && (
              <button
                onClick={() => onNavigate('employee')}
                className="flex items-center gap-2 px-1 py-1 text-xs font-bold text-white hover:text-[#80A6D7] transition-colors cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-[#80A6D7]" />
                <span className="font-bold">Employee Service Hub</span>
              </button>
            )}

            {isHead && (
              <>
                <button
                  onClick={() => onNavigate('manager')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    currentView === 'manager'
                      ? 'bg-[#1E293B] text-white border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5 text-[#80A6D7]" />
                  <span>Supervisory Command Portal</span>
                  {criticalCount > 0 && (
                    <span className="ml-1 text-[11px] font-mono text-red-400 font-bold">
                      ({criticalCount})
                    </span>
                  )}
                </button>

                <button
                  onClick={() => onNavigate('memory')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    currentView === 'memory'
                      ? 'bg-[#1E293B] text-white border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Archive className="w-3.5 h-3.5 text-[#80A6D7]" />
                  <span>Operational Memory</span>
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Right Section: TRACE v1.0.4-NOC */}
        <div className="flex items-center gap-3">
          {/* TRACE v1.0.4-NOC (No Background) */}
          <div className="flex items-center gap-2 px-1 text-xs font-mono select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="font-semibold text-slate-300">TRACE</span>
            <span className="text-slate-500">v1.0.4-NOC</span>
          </div>
        </div>

      </div>
    </header>
  );
};
