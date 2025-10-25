import React from 'react';
import { View, ViewProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const hstackVariants = cva(
  "flex-row",
  {
    variants: {
      space: {
        xs: "gap-1",
        sm: "gap-2",
        md: "gap-3",
        lg: "gap-4",
        xl: "gap-5",
        "2xl": "gap-6",
        "3xl": "gap-7",
        "4xl": "gap-8",
      },
      reversed: {
        true: "flex-row-reverse",
      },
    },
    defaultVariants: {
      space: "md",
      reversed: false,
    },
  }
);

interface HStackProps extends ViewProps, VariantProps<typeof hstackVariants> {
  className?: string;
}

const HStack = React.forwardRef<View, HStackProps>(
  ({ className, space, reversed, ...props }, ref) => {
    return (
      <View
        ref={ref}
        className={cn(
          "flex relative z-0 box-border border-0 list-none min-w-0 min-h-0 bg-transparent items-stretch m-0 p-0",
          hstackVariants({ space, reversed }),
          className
        )}
        {...props}
      />
    );
  }
);

HStack.displayName = 'HStack';

export { HStack, hstackVariants };
