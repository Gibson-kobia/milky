import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-milk-green-500 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border border-transparent bg-milk-green-100 text-milk-green-800',
        success: 'border border-transparent bg-green-100 text-green-800',
        warning: 'border border-transparent bg-milk-amber-100 text-milk-amber-800',
        error: 'border border-transparent bg-red-100 text-red-800',
        secondary: 'border border-transparent bg-gray-100 text-gray-800',
        outline: 'border border-gray-300 text-gray-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
