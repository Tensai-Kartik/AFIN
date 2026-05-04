'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from './auth-provider';
import { useRouter } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import React, { useState } from 'react';

export function RequireVerification({ children }: { children: React.ReactElement }) {
  const { isVerified } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  if (isVerified) {
    return <>{children}</>;
  }

  // Intercept click to show verification alert instead of performing the action
  const trigger = React.cloneElement(children as React.ReactElement<any>, {
    onClick: (e: React.MouseEvent) => {
      // Don't call the original onClick (which might open another dialog)
      e.preventDefault();
      e.stopPropagation();
      setIsOpen(true);
    }
  });

  return (
    <>
      {trigger}
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent className="rounded-2xl sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              Verification Required
            </AlertDialogTitle>
            <AlertDialogDescription>
              You need to verify your account before contributing. Verification helps keep our community safe and ensures content quality.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" onClick={() => setIsOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                setIsOpen(false);
                router.push('/profile');
              }}
            >
              Go to Profile
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
