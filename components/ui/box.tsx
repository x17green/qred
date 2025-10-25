import React from 'react';
import { View, ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

interface BoxProps extends ViewProps {
  className?: string;
}

const Box = React.forwardRef<View, BoxProps>(
  ({ className, ...props }, ref) => {
    return (
      <View
        ref={ref}
        className={cn(
          "flex flex-col relative z-0 box-border border-0 list-none min-w-0 min-h-0 bg-transparent items-stretch m-0 p-0",
          className
        )}
        {...props}
      />
    );
  }
);

Box.displayName = 'Box';

export { Box };
