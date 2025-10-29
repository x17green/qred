'use client';
import { H1, H2, H3, H4, H5, H6 } from '@expo/html-elements';
import React from 'react';
import { Text as RNText } from 'react-native';

import type { VariantProps } from '@gluestack-ui/nativewind-utils';
import { tva } from '@gluestack-ui/nativewind-utils/tva';
import { withStyleContext } from '@gluestack-ui/nativewind-utils/withStyleContext';

type IHeadingProps = React.ComponentProps<typeof RNText> &
  VariantProps<typeof headingStyle> & {
    className?: string;
    as?: React.ElementType;
  };

const headingStyle = tva({
  base: 'text-typography-900 font-bold font-heading tracking-sm my-0 web:select-none',
  variants: {
    isTruncated: {
      true: 'truncate',
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
    size: {
      '5xl': 'text-6xl',
      '4xl': 'text-5xl',
      '3xl': 'text-4xl',
      '2xl': 'text-3xl',
      xl: 'text-2xl',
      lg: 'text-xl',
      md: 'text-lg',
      sm: 'text-base',
      xs: 'text-sm',
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
  },
  defaultVariants: {
    size: 'md',
  },
});

const MappedHeading = RNText;

const Heading = withStyleContext(
  React.forwardRef<
    React.ElementRef<typeof MappedHeading>,
    IHeadingProps & {
      className?: string;
    }
  >(({ className, size = 'md', ...props }, ref) => {
    const { as: AsComp = getHeadingComponent(size), ...restProps } = props;

    return (
      <AsComp
        className={headingStyle({ size, class: className })}
        {...restProps}
        ref={ref}
      />
    );
  })
);

function getHeadingComponent(size: string) {
  switch (size) {
    case '5xl':
    case '4xl':
    case '3xl':
      return H1;
    case '2xl':
      return H2;
    case 'xl':
      return H3;
    case 'lg':
      return H4;
    case 'md':
      return H5;
    case 'sm':
    case 'xs':
      return H6;
    default:
      return H5;
  }
}

Heading.displayName = 'Heading';

export { Heading };
