'use client';
import type { VariantProps } from '@gluestack-ui/nativewind-utils';
import { tva } from '@gluestack-ui/nativewind-utils/tva';
import { withStyleContext } from '@gluestack-ui/nativewind-utils/withStyleContext';
import React from 'react';
import type { TextProps, ViewProps } from 'react-native';
import { Text, View } from 'react-native';

const badgeStyle = tva({
  base: 'flex-row items-center rounded-sm data-[disabled=true]:opacity-50 px-2 py-1',
  variants: {
    action: {
      error: 'bg-background-error border-error-300',
      warning: 'bg-background-warning border-warning-300',
      success: 'bg-background-success border-success-300',
      info: 'bg-background-info border-info-300',
      muted: 'bg-background-muted border-background-300',
      primary: 'bg-primary-50 border-primary-200',
      secondary: 'bg-secondary-50 border-secondary-200',
    },
    variant: {
      solid: '',
      outline: 'border bg-background-0',
    },
    size: {
      sm: '',
      md: '',
      lg: '',
    },
  },
  defaultVariants: {
    action: 'muted',
    variant: 'solid',
    size: 'md',
  },
});

const badgeTextStyle = tva({
  base: 'text-typography-700 font-body font-normal tracking-normal uppercase',
  variants: {
    isTruncated: {
      true: 'web:truncate',
    },
    bold: {
      true: 'font-bold',
    },
    underline: {
      true: 'underline',
    },
    strikeThrough: {
      true: 'line-through',
    },
    sub: {
      true: 'text-xs',
    },
    italic: {
      true: 'italic',
    },
    highlight: {
      true: 'bg-yellow-500',
    },
    action: {
      error: 'text-error-600',
      warning: 'text-warning-600',
      success: 'text-success-600',
      info: 'text-info-600',
      muted: 'text-background-800',
      primary: 'text-primary-600',
      secondary: 'text-secondary-600',
    },
    size: {
      sm: 'text-2xs',
      md: 'text-xs',
      lg: 'text-sm',
    },
  },
});

const badgeIconStyle = tva({
  base: 'fill-none',
  variants: {
    action: {
      error: 'text-error-600',
      warning: 'text-warning-600',
      success: 'text-success-600',
      info: 'text-info-600',
      muted: 'text-background-800',
      primary: 'text-primary-600',
      secondary: 'text-secondary-600',
    },
    size: {
      sm: 'h-3 w-3',
      md: 'h-3.5 w-3.5',
      lg: 'h-4 w-4',
    },
  },
});

type IBadgeProps = ViewProps &
  VariantProps<typeof badgeStyle> & {
    className?: string;
  };

type IBadgeTextProps = TextProps &
  VariantProps<typeof badgeTextStyle> & {
    className?: string;
  };

type IBadgeIconProps = ViewProps &
  VariantProps<typeof badgeIconStyle> & {
    className?: string;
    as?: React.ComponentType<any>;
  };

const Badge = withStyleContext(
  React.forwardRef<React.ElementRef<typeof View>, IBadgeProps>(
    ({ className, action = 'muted', variant = 'solid', size = 'md', ...props }, ref) => {
      return (
        <View
          className={badgeStyle({ action, variant, size, class: className })}
          {...props}
          ref={ref}
        />
      );
    }
  )
);

const BadgeText = React.forwardRef<
  React.ElementRef<typeof Text>,
  IBadgeTextProps
>(({ className, action, size, ...props }, ref) => {
  return (
    <Text
      className={badgeTextStyle({ action, size, class: className })}
      {...props}
      ref={ref}
    />
  );
});

const BadgeIcon = React.forwardRef<
  React.ElementRef<typeof View>,
  IBadgeIconProps
>(({ className, action, size, as: AsComp, ...props }, ref) => {
  if (AsComp) {
    return (
      <AsComp
        className={badgeIconStyle({ action, size, class: className })}
        {...props}
        ref={ref}
      />
    );
  }

  return (
    <View
      className={badgeIconStyle({ action, size, class: className })}
      {...props}
      ref={ref}
    />
  );
});

Badge.displayName = 'Badge';
BadgeText.displayName = 'BadgeText';
BadgeIcon.displayName = 'BadgeIcon';

export { Badge, BadgeIcon, BadgeText };
