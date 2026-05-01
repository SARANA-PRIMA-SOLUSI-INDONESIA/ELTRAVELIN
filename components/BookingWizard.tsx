import React from 'react';

interface BookingWizardProps {
  step: 1 | 2 | 3 | 4;
}

export default function BookingWizard({ step }: BookingWizardProps) {
  const steps = [
    { id: 1, label: 'Book' },
    { id: 2, label: 'Review' },
    { id: 3, label: 'Pay' },
    { id: 4, label: 'E-ticket' },
  ];

  return (
    <div className="w-full bg-white border-b border-gray-100 py-4">
      <div className="max-w-7xl mx-auto px-6 flex justify-center items-center">
        <div className="flex items-center gap-4 md:gap-12">
          {steps.map((s, i) => (
            <React.Fragment key={s.id}>
              <div className="flex items-center gap-2 md:gap-3">
                <div className={`w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold ${
                  step === s.id ? 'bg-gold-warm text-white' : 
                  step > s.id ? 'bg-navy-deep text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  {s.id}
                </div>
                <span className={`text-[10px] md:text-sm font-bold ${
                  step === s.id ? 'text-navy-deep' : 'text-gray-400'
                } hidden xs:block`}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="h-[1px] w-8 md:w-16 bg-gray-200"></div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
