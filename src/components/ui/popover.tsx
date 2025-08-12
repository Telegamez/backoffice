import * as React from 'react';

export const Popover: React.FC<{ open: boolean; onOpenChange: (v: boolean) => void; anchorRef: React.RefObject<HTMLElement>; children: React.ReactNode }>
  = ({ open, onOpenChange, anchorRef, children }) => {
  return open ? (
    <div className="fixed inset-0 z-50" onClick={() => onOpenChange(false)}>
      <div
        className="absolute rounded-md border bg-card p-3 text-sm shadow-md"
        style={{
          left: (anchorRef.current?.getBoundingClientRect().left ?? 0),
          top: ((anchorRef.current?.getBoundingClientRect().bottom ?? 0) + 8),
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  ) : null;
};


