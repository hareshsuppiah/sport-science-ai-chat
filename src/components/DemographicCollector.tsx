import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '../lib/utils';
import { ExternalLink } from 'lucide-react';

interface DemographicCollectorProps {
  onComplete: (demographics: {
    userType: string;
    ageRange?: string;
    experienceLevel?: string;
    primarySport?: string;
    consentGiven: boolean;
  }) => void;
  isOpen: boolean;
}

const userTypes = ['Athlete', 'Sport Scientist', 'Coach', 'Parent'];
const ageRanges = ['Under 18', '18-24', '25-34', '35-44', '45+'];
const experienceLevels = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];

export function DemographicCollector({ onComplete, isOpen }: DemographicCollectorProps) {
  const [step, setStep] = useState<'type' | 'details'>('type');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [details, setDetails] = useState({
    ageRange: '',
    experienceLevel: '',
    primarySport: '',
  });

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    setStep('details');
  };

  const handleComplete = () => {
    if (!selectedType) return;
    onComplete({
      userType: selectedType,
      ...details,
      consentGiven: true
    });
  };

  return (
    <Dialog.Root open={isOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className={cn(
          "fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]",
          "w-full max-w-lg border border-black/10 dark:border-white/10",
          "bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm p-6",
          "rounded-2xl shadow-lg"
        )}>
          <div className="space-y-4">
            <Dialog.Title className="text-lg font-semibold">
              Welcome to the Sports Science Research Assistant
            </Dialog.Title>
            <Dialog.Description className="text-sm text-black/70 dark:text-white/70">
              By proceeding, you agree to participate in our research study. Your interactions will be logged for research purposes.{' '}
              <a 
                href="/consent-form" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-600 font-medium"
              >
                View Consent Form
                <ExternalLink className="h-3 w-3" />
              </a>
            </Dialog.Description>

            <div className="pt-4">
              <h3 className="text-sm font-medium text-black/70 dark:text-white/70 mb-3">
                To help provide more relevant insights, please tell us about yourself:
              </h3>

              {step === 'type' && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {userTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => handleTypeSelect(type)}
                      className={cn(
                        "p-4 rounded-xl border border-black/10 dark:border-white/10",
                        "bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm",
                        "hover:bg-white/80 dark:hover:bg-zinc-900/80",
                        "transition-all duration-200",
                        "flex items-center justify-center text-sm font-medium"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}

              {step === 'details' && selectedType && (
                <div className="space-y-4">
                  <select
                    value={details.ageRange}
                    onChange={(e) => setDetails(d => ({ ...d, ageRange: e.target.value }))}
                    className="w-full p-2 rounded-lg border border-black/10 dark:border-white/10 bg-white/50 dark:bg-zinc-900/50"
                  >
                    <option value="">Select Age Range</option>
                    {ageRanges.map(range => (
                      <option key={range} value={range}>{range}</option>
                    ))}
                  </select>

                  <select
                    value={details.experienceLevel}
                    onChange={(e) => setDetails(d => ({ ...d, experienceLevel: e.target.value }))}
                    className="w-full p-2 rounded-lg border border-black/10 dark:border-white/10 bg-white/50 dark:bg-zinc-900/50"
                  >
                    <option value="">Select Experience Level</option>
                    {experienceLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="Primary Sport (optional)"
                    value={details.primarySport}
                    onChange={(e) => setDetails(d => ({ ...d, primarySport: e.target.value }))}
                    className="w-full p-2 rounded-lg border border-black/10 dark:border-white/10 bg-white/50 dark:bg-zinc-900/50"
                  />

                  <div className="pt-2 text-xs text-black/50 dark:text-white/50">
                    By clicking continue, you confirm that you have read and agree to the consent form.
                  </div>

                  <button
                    onClick={handleComplete}
                    className="w-full p-2 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors"
                  >
                    Continue to Research
                  </button>
                </div>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
} 