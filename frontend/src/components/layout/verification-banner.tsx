'use client';

import Link from 'next/link';
import { useAuth } from '@/components/auth-provider';
import { AlertTriangle, Clock, CheckCircle, X } from 'lucide-react';
import { useState } from 'react';

export function VerificationBanner() {
  const { dbUser, isVerified, hasPendingVerification } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || isVerified) return null;

  // Unverified — profile not even submitted yet
  const isUnsubmitted = dbUser?.prn?.startsWith('PENDING-');

  if (!isUnsubmitted && !hasPendingVerification) return null;

  return (
    <div
      className={`w-full px-4 py-3 flex items-center gap-3 text-sm font-medium ${
        hasPendingVerification
          ? 'bg-blue-50 border-b border-blue-100 text-blue-800'
          : 'bg-amber-50 border-b border-amber-100 text-amber-800'
      }`}
    >
      <div className="flex-shrink-0">
        {hasPendingVerification ? (
          <Clock className="h-4 w-4 text-blue-500" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        )}
      </div>

      <span className="flex-1">
        {hasPendingVerification ? (
          <>
            Your verification request is <strong>under review</strong>. You can view all content
            while you wait. Uploading and requesting will be enabled once an admin approves you.
          </>
        ) : (
          <>
            You're browsing as a <strong>guest student</strong> — you can view all content but
            cannot upload or make requests.{' '}
            <Link
              href="/profile"
              className="underline underline-offset-2 hover:text-amber-900 font-semibold transition-colors"
            >
              Verify your identity →
            </Link>
          </>
        )}
      </span>

      <button
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 rounded-full p-1 hover:bg-black/10 transition-colors"
        aria-label="Dismiss banner"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
