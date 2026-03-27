import React from 'react';
import { base44 } from '@/api/base44Client';

export default function AccountDisabledError() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg border border-slate-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-red-100">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Account Disabled</h1>
          <p className="text-slate-600 mb-8">
            Your account has been disabled. Please contact your administrator to restore access.
          </p>
          <button
            onClick={() => base44.auth.logout()}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}