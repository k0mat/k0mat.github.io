import React from 'react';
import { MessageSquare, Key, Sparkles, ArrowRight } from 'lucide-react';

interface WelcomeScreenProps {
  onOpenSettings: () => void;
}

export default function WelcomeScreen({ onOpenSettings }: WelcomeScreenProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900/30">
            <MessageSquare className="h-12 w-12 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Welcome to io-ai
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            A browser-only multi-LLM chat app. No server required.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3 text-left p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
            <Key className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                Add Your API Keys
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Connect to OpenRouter to start chatting with AI models.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 text-left p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
            <Sparkles className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                Choose Your Model
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Select from various AI models and customize your experience.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenSettings}
          className="btn btn-primary w-full flex items-center justify-center gap-2"
        >
          Get Started
          <ArrowRight className="h-4 w-4" />
        </button>

        <p className="text-xs text-zinc-500 dark:text-zinc-500">
          Your API keys are stored locally and never sent to any server.
        </p>
      </div>
    </div>
  );
}