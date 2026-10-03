import React, { useState, useEffect, useRef } from 'react';
import { LogOut } from 'lucide-react';

interface ProfileAvatarDropdownProps {
  avatarUrl?: string;
  userName?: string;
  onSignOut: () => void;
  className?: string;
}

export const ProfileAvatarDropdown: React.FC<ProfileAvatarDropdownProps> = ({
  avatarUrl,
  userName = 'User',
  onSignOut,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside and escape key press
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSignOutClick = () => {
    setIsOpen(false);
    onSignOut();
  };


  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      {/* Avatar Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="User profile menu"
        className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#101828] border border-slate-700/80 hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-[#80A6D7]/40 transition-all duration-200 cursor-pointer overflow-hidden group shadow-sm active:scale-95"
      >
        <img
          src={avatarUrl && !imgError ? avatarUrl : '/default.png'}
          alt={userName}
          onError={(e) => {
            if (!imgError) {
              setImgError(true);
              (e.target as HTMLImageElement).src = '/default.png';
            }
          }}
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
        />
      </button>

      {/* Dropdown Menu - Single Option: 'Sign out' */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-44 rounded-xl bg-[#101828] border border-slate-800 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl"
        >
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOutClick}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-red-400 hover:bg-red-950/20 active:bg-red-950/40 transition-all duration-150 cursor-pointer group"
          >
            <LogOut className="w-4 h-4 text-slate-400 group-hover:text-red-400 transition-colors" />
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileAvatarDropdown;
