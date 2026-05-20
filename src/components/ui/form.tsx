import * as React from 'react';
import { cn } from '@/lib/cn';

const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
      className
    )}
    {...props}
  />
));
Label.displayName = 'Label';

const FormField = ({
  label,
  error,
  children,
  required,
}: {
  label?: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
}) => (
  <div className="flex flex-col space-y-1.5">
    {label && (
      <Label>
        {label}
        {required && <span className="ml-1 text-red-600">*</span>}
      </Label>
    )}
    {children}
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
);

export { Label, FormField };
