import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium rounded-full transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-to-r from-medical-blue to-[#0051EB] text-white shadow-glow-blue hover:shadow-lg hover:brightness-105 focus:ring-medical-blue',
        cyan:
          'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-glow-cyan hover:brightness-105 focus:ring-cyan-400',
        emergency:
          'bg-gradient-to-r from-rose-600 to-emergency-red text-white shadow-glow-red hover:brightness-105 focus:ring-rose-500 animate-pulse-slow',
        glass:
          'glass-pill text-slate-800 dark:text-slate-100 hover:bg-white/90 dark:hover:bg-navy-800/90 hover:border-slate-300 focus:ring-slate-300',
        outline:
          'border border-slate-300 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800',
        ghost:
          'bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
        danger:
          'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 focus:ring-rose-500',
      },
      size: {
        sm: 'text-xs px-3.5 py-1.5 gap-1.5 h-8',
        md: 'text-sm px-5 py-2.5 gap-2 h-11',
        lg: 'text-base px-7 py-3.5 gap-2.5 h-13',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
