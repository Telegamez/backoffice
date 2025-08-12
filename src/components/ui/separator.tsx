import * as React from 'react';
import { cn } from '@/lib/utils';

export const Separator: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    role="separator"
    className={cn('shrink-0 bg-border', 'h-px w-full', className)}
    {...props}
  />
);




