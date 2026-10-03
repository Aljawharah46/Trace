import React from 'react';
import { ArrowLeft, Shield, LogOut } from 'lucide-react';
import { useIncident } from '../../context/IncidentContext';

interface EmployeeProfileViewProps {
  onBack: () => void;
  backLabel?: string;
}

export const EmployeeProfileView: React.FC<EmployeeProfileViewProps> = ({ onBack, backLabel }) => {
  const { currentUser, logout } = useIncident();

  const formattedRole = currentUser.role === 'employee' ? 'Employee' : currentUser.role.toUpperCase();

  return (
    <div className="w-full max-w-xl mx-auto py-10 px-4 sm:px-6 animate-in fade-in slide-in-from-bottom-3 duration-200">
      {/* Return Button */}
      <div className="mb-6">
        <button
          onClick={onBack}
          type="button"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#101828] border border-slate-700/80 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-500 transition-colors cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#80A6D7]" />
          <span>{backLabel || (currentUser.role === 'employee' ? 'Back to Chat' : 'Back to Active Queue')}</span>
        </button>
      </div>

      {/* Main Profile Card - Exclusively Profile picture, Name, Email, and Role */}
      <div className="rounded-3xl bg-[#101828] border border-slate-700/80 shadow-2xl p-8 sm:p-10 flex flex-col items-center text-center relative overflow-hidden">
        {/* Subtle background ambient aura */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#80A6D7]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* 1. Profile Picture */}
        <div className="relative mb-6">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-br from-[#80A6D7]/40 via-slate-700/40 to-slate-800 border border-slate-600 shadow-xl overflow-hidden flex items-center justify-center">
            <img
              src={currentUser.avatar || '/default.png'}
              alt={currentUser.name}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/default.png';
              }}
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#101828] flex items-center justify-center shadow" title="Active">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
          </span>
        </div>

        {/* 2. Name */}
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F8F7F8] tracking-tight">
          {currentUser.name}
        </h2>

        {/* 3. Email */}
        <p className="text-xs sm:text-sm text-slate-400 mt-1.5 font-mono select-all">
          {currentUser.email}
        </p>

        {/* 4. Role */}
        <div className="mt-5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#1E293B] border border-slate-700 text-[#80A6D7] shadow-inner">
          <Shield className="w-3.5 h-3.5" />
          <span>Role: {formattedRole}</span>
        </div>

        {/* 5. Clean Sign Out Option */}
        <div className="mt-8 pt-6 border-t border-slate-800 w-full flex justify-center">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              logout();
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 bg-red-950/20 hover:bg-red-950/40 border border-red-900/40 transition-all cursor-pointer shadow-sm active:scale-95 group"
          >
            <LogOut className="w-4 h-4 text-red-400 group-hover:text-red-300 transition-colors" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfileView;
