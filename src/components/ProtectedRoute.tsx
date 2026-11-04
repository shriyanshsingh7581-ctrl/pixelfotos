import React from 'react';
import { UserRole } from '../types';
import { useAuth } from '../hooks/useAuth';
import { ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { activeRole, setActiveRole } = useAuth();

  if (!allowedRoles.includes(activeRole)) {
    return (
      <div className="p-8 max-w-xl mx-auto my-12 bg-white border border-slate-200 rounded-xl text-center">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-semibold text-slate-900 mb-2">Role Permission Restricted</h2>
        <p className="text-sm text-slate-600 mb-6">
          Your current active role (<span className="font-mono font-medium">{activeRole}</span>) does not have permission to view this workspace module. Required role: {allowedRoles.join(' or ')}.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setActiveRole(allowedRoles[0])}
            className="px-4 py-2 bg-[#0F172A] text-white text-xs font-medium rounded-lg hover:bg-slate-800 transition-colors"
          >
            Switch Role to {allowedRoles[0].replace('_', ' ')}
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
