import React from 'react';
import { Info } from 'lucide-react';

export function ConsentBanner() {
  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Info className="h-5 w-5 text-blue-400" />
        </div>
        <div className="ml-3">
          <p className="text-sm text-blue-700">
            By using this chatbot, you agree to our{' '}
            <a
              href="/consent"
              className="font-medium underline hover:text-blue-600"
              target="_blank"
              rel="noopener noreferrer"
            >
              consent form
            </a>
            . Your interactions will be logged for research purposes.
          </p>
        </div>
      </div>
    </div>
  );
}