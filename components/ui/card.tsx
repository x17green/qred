'use client';
import type { VariantProps } from '@gluestack-ui/nativewind-utils';
import { tva } from '@gluestack-ui/nativewind-utils/tva';
import { withStyleContext } from '@gluestack-ui/nativewind-utils/withStyleContext';
import React from 'react';
import type { ViewProps } from 'react-native';
import { View } from 'react-native';

const cardStyle = tva({
  base: 'bg-background-0 rounded-xl border border-outline-200 shadow-sm overflow-hidden',
  variants: {
    variant: {
      elevated: 'shadow-md bg-background-0 border-0',
      outline: 'border border-outline-200 bg-background-0',
      filled: 'bg-background-50 border-0',
      ghost: 'border-0 bg-transparent',
    },
    size: {
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    },
  },
  defaultVariants: {
    variant: 'elevated',
    size: 'md',
  },
});

const cardHeaderStyle = tva({
  base: 'pb-3 border-b border-outline-100',
});

const cardBodyStyle = tva({
  base: 'py-3',
});

const cardFooterStyle = tva({
  base: 'pt-3 border-t border-outline-100',
});

type ICardProps = ViewProps &
  VariantProps<typeof cardStyle> & {
    className?: string;
  };

type ICardHeaderProps = ViewProps & {
  className?: string;
};

type ICardBodyProps = ViewProps & {
  className?: string;
};

type ICardFooterProps = ViewProps & {
  className?: string;
};

const Card = withStyleContext(
  React.forwardRef<React.ElementRef<typeof View>, ICardProps>(
    ({ className, variant = 'elevated', size = 'md', ...props }, ref) => {
      return (
        <View
          className={cardStyle({ variant, size, class: className })}
          {...props}
          ref={ref}
        />
      );
    }
  )
);

const CardHeader = React.forwardRef<
  React.ElementRef<typeof View>,
  ICardHeaderProps
>(({ className, ...props }, ref) => {
  return (
    <View
      className={cardHeaderStyle({ class: className })}
      {...props}
      ref={ref}
    />
  );
});

const CardBody = React.forwardRef<
  React.ElementRef<typeof View>,
  ICardBodyProps
>(({ className, ...props }, ref) => {
  return (
    <View
      className={cardBodyStyle({ class: className })}
      {...props}
      ref={ref}
    />
  );
});

const CardFooter = React.forwardRef<
  React.ElementRef<typeof View>,
  ICardFooterProps
>(({ className, ...props }, ref) => {
  return (
    <View
      className={cardFooterStyle({ class: className })}
      {...props}
      ref={ref}
    />
  );
});

Card.displayName = 'Card';
CardHeader.displayName = 'CardHeader';
CardBody.displayName = 'CardBody';
CardFooter.displayName = 'CardFooter';

export { Card, CardBody, CardFooter, CardHeader };
