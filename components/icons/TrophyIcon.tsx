
import React from 'react';

export const TrophyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9a9.75 9.75 0 011.05-4.383 9.75 9.75 0 014.383-1.05h.134a9.75 9.75 0 014.383 1.05 9.75 9.75 0 011.05 4.383z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 1.5v6.75m0 0l-3-3m3 3l3-3M5.25 9.75A9.75 9.75 0 0112 4.5a9.75 9.75 0 016.75 5.25" />
  </svg>
);
