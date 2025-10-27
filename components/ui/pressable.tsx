import React from 'react';
import { Pressable as RNPressable, PressableProps as RNPressableProps } from 'react-native';

type IPressableProps = RNPressableProps & {
  className?: string;
};

export const Pressable = React.forwardRef<
  React.ElementRef<typeof RNPressable>,
  IPressableProps
>(({ className, style, ...props }, ref) => {
  return (
    <RNPressable
      ref={ref}
      style={style}
      {...props}
    />
  );
});

Pressable.displayName = 'Pressable';
