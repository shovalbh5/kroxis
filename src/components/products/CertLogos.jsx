import React from 'react';

export const AnsiLogo = ({ className }) => (
  <svg viewBox="0 0 120 60" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="60" cy="30" rx="50" ry="22" fill="none" stroke="currentColor" strokeWidth="5"/>
    <ellipse cx="60" cy="30" rx="43" ry="15" fill="none" stroke="currentColor" strokeWidth="1.5"/>
    <text x="60" y="41" fontSize="28" fontWeight="900" fontStyle="italic" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="1">ANSI</text>
  </svg>
);

export const CeLogo = ({ className }) => (
  <svg viewBox="0 0 120 60" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M 55 15 A 20 20 0 1 0 55 45" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
    <path d="M 105 15 A 20 20 0 1 0 105 45" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
    <line x1="85" y1="30" x2="100" y2="30" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
  </svg>
);

export const MilLogo = ({ className }) => (
  <svg viewBox="0 0 120 60" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <text x="60" y="42" fontSize="34" fontWeight="500" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="3">MIL</text>
    <path d="M 75 42 L 90 42" stroke="currentColor" strokeWidth="3" />
  </svg>
);

export const En166Logo = ({ className }) => (
  <svg viewBox="0 0 120 60" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <text x="60" y="42" fontSize="32" fontWeight="500" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="1">EN166</text>
  </svg>
);

export const OshaLogo = ({ className }) => (
  <svg viewBox="0 0 120 60" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <text x="60" y="42" fontSize="32" fontWeight="800" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="1">OSHA</text>
  </svg>
);

export const getCertLogo = (cert, className = "h-5 w-auto") => {
  switch (cert) {
    case 'ANSI_Z87': return <AnsiLogo className={className} />;
    case 'CE_EN166': return (
      <div className="flex items-center gap-3">
        <CeLogo className={className} />
        <MilLogo className={className} />
        <En166Logo className={className} />
      </div>
    );
    case 'MIL_PRF': return null; // Handled inside CE_EN166 for the specific "Meet" row, though this breaks individual rendering.
    case 'MIL_PRF': return <MilLogo className={className} />;
    case 'OSHA': return <OshaLogo className={className} />;
    default: return null;
  }
};