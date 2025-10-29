'use client';
import type { VariantProps } from '@gluestack-ui/nativewind-utils';
import { tva } from '@gluestack-ui/nativewind-utils/tva';
import { withStyleContext } from '@gluestack-ui/nativewind-utils/withStyleContext';
import React from 'react';
import { Svg, SvgProps } from 'react-native-svg';

const iconStyle = tva({
  base: 'text-typography-950 fill-none pointer-events-none',
  variants: {
    size: {
      '2xs': 'h-3 w-3',
      xs: 'h-3.5 w-3.5',
      sm: 'h-4 w-4',
      md: 'h-[18px] w-[18px]',
      lg: 'h-5 w-5',
      xl: 'h-6 w-6',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

type IIconProps = SvgProps &
  VariantProps<typeof iconStyle> & {
    as?: React.ComponentType<any>;
    className?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xs';
  };

const Icon = withStyleContext(
  React.forwardRef<React.ElementRef<typeof Svg>, IIconProps>(
    ({ className, size = 'md', as: AsComp, ...props }, ref) => {
      if (AsComp) {
        return (
          <AsComp
            className={iconStyle({ size, class: className })}
            {...props}
            ref={ref}
          />
        );
      }
      return (
        <Svg
          className={iconStyle({ size, class: className })}
          {...props}
          ref={ref}
        />
      );
    }
  )
);

Icon.displayName = 'Icon';

export { Icon };
