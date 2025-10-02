"use client";

import { useEffect } from 'react';
import { redirect } from 'next/navigation';

export default function MailAssistantRedirect() {
  useEffect(() => {
    redirect('/apps/assistant');
  }, []);

  return (
    <div className="min-h-screen p-6 text-center">
      <p>Redirecting to the new AI Assistant experience...</p>
    </div>
  );
}