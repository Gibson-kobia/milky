'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export function InstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!visible || !promptEvent) {
    return null;
  }

  const handleInstall = async () => {
    promptEvent.prompt();
    const choiceResult = await promptEvent.userChoice;
    if (choiceResult.outcome === 'accepted') {
      setVisible(false);
      setPromptEvent(null);
    }
  };

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 rounded-3xl border border-gray-200 bg-white px-4 py-4 shadow-lg shadow-gray-900/5 sm:left-auto sm:right-8 sm:w-[360px]">
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">Install Milky</p>
          <p className="text-sm text-gray-600">Add Milky to your home screen for a native app experience.</p>
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setVisible(false)}>
            Dismiss
          </Button>
          <Button size="sm" onClick={handleInstall}>
            Install
          </Button>
        </div>
      </div>
    </div>
  );
}

declare global {
  interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    prompt: () => Promise<void>;
    readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  }
}
