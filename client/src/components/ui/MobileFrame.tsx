import React from 'react';

interface MobileFrameProps {
  children: React.ReactNode;
}

export function MobileFrame({ children }: MobileFrameProps) {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      {/* Desktop scale wrapper */}
      <div className="w-full max-w-[393px] mx-auto bg-white shadow-xl">
        {/* Mobile frame with locked 393px width */}
        <div className="w-[393px] min-h-screen bg-app-background relative overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}