import React from 'react';

export const StarBackground: React.FC = () => {
  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none"
      style={{
        background: 'linear-gradient(45deg, #2196F3 0%, #0a1628 100%)',
        backgroundSize: '200% 200%',
        animation: 'bgShift 6s ease infinite',
      }}
    >
      <style>{`
        @keyframes bgShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
};
