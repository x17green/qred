import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const textVariants = cva(
  "text-typography-700 font-body",
  {
    variants: {
      size: {
        '2xs': 'text-2xs',
        'xs': 'text-xs',
        'sm': 'text-sm',
        'md': 'text-base',
        'lg': 'text-lg',
        'xl': 'text-xl',
        '2xl': 'text-2xl',
        '3xl': 'text-3xl',
        '4xl': 'text-4xl',
        '5xl': 'text-5xl',
        '6xl': 'text-6xl',
      },
      bold: {
        true: 'font-bold',
      },
      italic: {
        true: 'italic',
      },
      underline: {
        true: 'underline',
      },
      strikeThrough: {
        true: 'line-through',
      },
      highlight: {
        true: 'bg-yellow-500',
      },
      isTruncated: {
        true: 'truncate',
      },
      sub: {
        true: 'text-xs',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

interface TextProps extends RNTextProps, VariantProps<typeof textVariants> {
  className?: string;
}

const Text = React.forwardRef<RNText, TextProps>(
  ({ className, size, bold, italic, underline, strikeThrough, highlight, isTruncated, sub, ...props }, ref) => {
    return (
      <RNText
        ref={ref}
        className={cn(
          textVariants({ size, bold, italic, underline, strikeThrough, highlight, isTruncated, sub }),
          className
        )}
        {...props}
      />
    );
  }
);

Text.displayName = 'Text';

export { Text, textVariants };
