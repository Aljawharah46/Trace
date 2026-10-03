import React, { useState, useEffect } from 'react';
import { useIncident } from './context/IncidentContext';
import { getStoredAuthInfo } from './context/AuthContext';
import { LoginSplitScreen } from './components/auth/LoginSplitScreen';
import { Header } from './components/layout/Header';
import { EmployeePortal } from './components/employee/EmployeePortal';
import { TechnicianPortal } from './components/technician/TechnicianPortal';
import { ManagerPortal } from './components/manager/ManagerPortal';
import { AIIncidentIntelligencePage } from './components/intelligence/AIIncidentIntelligencePage';
import { OperationalMemoryView } from './components/memory/OperationalMemoryView';
import { AccessDeniedView } from './components/common/AccessDeniedView';
import { ToastContainer } from './components/common/ToastContainer';

export const AppContent: React.FC = () => {
  const { 
    currentUser,
    isAuthenticated, 
    currentRole, 
    currentPath,
    navigate,
    activeInvestigationId, 
    accessDeniedState,
    clearAccessDenied,
    investigateTicket
  } = useIncident();

  // Listen directly to reactive auth changes for immediate re-render
  const [, setAuthTick] = useState<number>(0);
  useEffect(() => {
    const handleAuthEvent = () => {
      setAuthTick(prev => prev + 1);
    };
    window.addEventListener('trace-auth-change', handleAuthEvent);
    return () => {
      window.removeEventListener('trace-auth-change', handleAuthEvent);
    };
  }, []);

  const isActuallyAuth = isAuthenticated || getStoredAuthInfo().isAuthenticated;

  const isEmployee = currentRole === 'employee';
  const isHead = currentRole === 'manager' || currentRole === 'it_head';
  const isMember = currentRole === 'technician' || currentRole === 'it_member';

  const getDefaultViewForRole = (role: string): 'dashboard' | 'intelligence' | 'memory' | 'employee' | 'manager' | 'denied' => {
    if (role === 'employee') return 'employee';
    if (role === 'manager' || role === 'it_head') return 'manager';
    return 'dashboard';
  };

  const [currentView, setCurrentView] = useState<'dashboard' | 'intelligence' | 'memory' | 'employee' | 'manager' | 'denied'>(() => {
    return getDefaultViewForRole(currentRole);
  });

  // Keep currentView and currentRole in sync reactively
  useEffect(() => {
    if (isActuallyAuth) {
      if (currentPath === '/memory') {
        setCurrentView('memory');
      } else if (currentPath === '/intelligence') {
        setCurrentView('intelligence');
      } else {
        setCurrentView(getDefaultViewForRole(currentRole));
      }
    }
  }, [isActuallyAuth, currentUser.id, currentRole, currentPath]);

  // Route protection
  useEffect(() => {
    if (isActuallyAuth) {
      // If user is authenticated and on /login or /, guide to /dashboard seamlessly
      if (currentPath === '/login' || currentPath === '/') {
        navigate('/dashboard', { replace: true });
      }
    } else {
      // If user is not authenticated and trying to access internal routes, guide to /login
      if (currentPath !== '/login' && currentPath !== '/') {
        navigate('/login', { replace: true });
      }
    }
  }, [isActuallyAuth, currentPath, navigate]);

  // Unauthenticated guard: Render Login immediately whenever user is not authenticated
  if (!isActuallyAuth) {
    return (
      <div className="min-h-screen w-full bg-[#0F1319] text-[#F8F7F8] flex flex-col font-sans animate-in fade-in duration-200">
        <LoginSplitScreen />
        <ToastContainer />
      </div>
    );
  }

  const handleInvestigate = async (incidentId: string) => {
    const allowed = await investigateTicket(incidentId);
    if (allowed) {
      setCurrentView('intelligence');
      navigate('/intelligence');
    }
  };

  const handleNavigateToMemory = () => {
    setCurrentView('memory');
    navigate('/memory');
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  const getBackView = () => {
    if (isEmployee) return 'employee';
    if (isHead) return 'manager';
    return 'dashboard';
  };

  return (
    <div className="min-h-screen w-full bg-[#0F1319] text-[#F8F7F8] flex flex-col font-sans">
      
      {/* Top Header */}
      <Header
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          if (view === 'memory') navigate('/memory');
          else if (view === 'intelligence') navigate('/intelligence');
          else navigate('/dashboard');
        }}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        onToggleEmployeeSidebar={() => setIsSidebarOpen(prev => !prev)}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16 bg-[#0F1319]">
        
        {/* If 403 Forbidden is triggered, show AccessDeniedView */}
        {accessDeniedState ? (
          <AccessDeniedView
            resourceId={accessDeniedState.resourceId}
            reason={accessDeniedState.reason}
            onBack={() => {
              clearAccessDenied();
              setCurrentView(getBackView());
              navigate('/dashboard');
            }}
          />
        ) : (
          <>
            {isEmployee && (
              <EmployeePortal
                key={currentUser.id}
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
                onCloseSidebar={() => setIsSidebarOpen(false)}
              />
            )}

            {isMember && (
              <>
                {(currentView === 'dashboard' || (currentView !== 'intelligence' && currentView !== 'memory')) && (
                  <TechnicianPortal
                    key={currentUser.id}
                    isSidebarOpen={isSidebarOpen}
                    onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
                    onCloseSidebar={() => setIsSidebarOpen(false)}
                    onInvestigate={handleInvestigate}
                    onNavigateToMemory={handleNavigateToMemory}
                  />
                )}

                {currentView === 'intelligence' && (
                  <AIIncidentIntelligencePage
                    incidentId={activeInvestigationId || 'TRC-1001'}
                    onBack={() => {
                      setCurrentView('dashboard');
                      navigate('/dashboard');
                    }}
                    onNavigateToMemory={handleNavigateToMemory}
                  />
                )}

                {currentView === 'memory' && (
                  <OperationalMemoryView
                    onBack={() => {
                      setCurrentView('dashboard');
                      navigate('/dashboard');
                    }}
                  />
                )}
              </>
            )}

            {isHead && (
              <>
                {(currentView === 'manager' || currentView === 'dashboard' || (currentView !== 'intelligence' && currentView !== 'memory')) && (
                  <ManagerPortal
                    key={currentUser.id}
                    onInvestigate={handleInvestigate}
                    onNavigateToMemory={handleNavigateToMemory}
                  />
                )}

                {currentView === 'intelligence' && (
                  <AIIncidentIntelligencePage
                    incidentId={activeInvestigationId || 'TRC-1001'}
                    onBack={() => {
                      setCurrentView('manager');
                      navigate('/dashboard');
                    }}
                    onNavigateToMemory={handleNavigateToMemory}
                  />
                )}

                {currentView === 'memory' && (
                  <OperationalMemoryView
                    onBack={() => {
                      setCurrentView('manager');
                      navigate('/dashboard');
                    }}
                  />
                )}
              </>
            )}
          </>
        )}

      </main>

      {/* Enterprise NOC Footer */}
      {!isEmployee && (
        <footer className="border-t border-slate-800/80 bg-[#0F1319] py-5 px-4 sm:px-6 lg:px-8 text-xs font-mono text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-slate-400 font-medium">TRACE AI Autonomous Incident Intelligence Mesh</span>
            <span className="text-slate-600">•</span>
            <span>Build v1.0.4-NOC</span>
          </div>
        </footer>
      )}

      {/* Global Toast Container */}
      <ToastContainer />

    </div>
  );
};

export default function App() {
  return <AppContent />;
}
