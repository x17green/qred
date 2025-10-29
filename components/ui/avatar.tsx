'use client';
import type { VariantProps } from '@gluestack-ui/nativewind-utils';
import { tva } from '@gluestack-ui/nativewind-utils/tva';
import { withStyleContext } from '@gluestack-ui/nativewind-utils/withStyleContext';
import React from 'react';
import type { ImageProps, TextProps, ViewProps } from 'react-native';
import { Image, Text, View } from 'react-native';

const avatarStyle = tva({
  base: 'rounded-full justify-center items-center relative bg-primary-600 group-[.avatar-group]/avatar-group:-ml-2.5',
  variants: {
    size: {
      xs: 'w-6 h-6',
      sm: 'w-8 h-8',
      md: 'w-12 h-12',
      lg: 'w-16 h-16',
      xl: 'w-24 h-24',
      '2xl': 'w-32 h-32',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const avatarImageStyle = tva({
  base: 'h-full w-full rounded-full absolute z-10',
});

const avatarFallbackTextStyle = tva({
  base: 'text-typography-0 font-semibold overflow-hidden uppercase web:cursor-default',
  variants: {
    size: {
      xs: 'text-2xs',
      sm: 'text-xs',
      md: 'text-base',
      lg: 'text-xl',
      xl: 'text-3xl',
      '2xl': 'text-5xl',
    },
  },
});

const avatarBadgeStyle = tva({
  base: 'rounded-full absolute right-0 bottom-0 border-background-0 border-2 bg-success-500',
  variants: {
    size: {
      xs: 'w-2 h-2',
      sm: 'w-2 h-2',
      md: 'w-3 h-3',
      lg: 'w-4 h-4',
      xl: 'w-6 h-6',
      '2xl': 'w-8 h-8',
    },
  },
});

const avatarGroupStyle = tva({
  base: 'group/avatar-group flex-row-reverse relative avatar-group',
});

type IAvatarProps = ViewProps &
  VariantProps<typeof avatarStyle> & {
    className?: string;
  };

type IAvatarImageProps = ImageProps & {
  className?: string;
};

type IAvatarFallbackTextProps = TextProps &
  VariantProps<typeof avatarFallbackTextStyle> & {
    className?: string;
  };

type IAvatarBadgeProps = ViewProps &
  VariantProps<typeof avatarBadgeStyle> & {
    className?: string;
  };

type IAvatarGroupProps = ViewProps & {
  className?: string;
};

const Avatar = withStyleContext(
  React.forwardRef<React.ElementRef<typeof View>, IAvatarProps>(
    ({ className, size = 'md', ...props }, ref) => {
      return (
        <View
          className={avatarStyle({ size, class: className })}
          {...props}
          ref={ref}
        />
      );
    }
  )
);

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof Image>,
  IAvatarImageProps
>(({ className, ...props }, ref) => {
  return (
    <Image
      className={avatarImageStyle({ class: className })}
      {...props}
      ref={ref}
    />
  );
});

const AvatarFallbackText = React.forwardRef<
  React.ElementRef<typeof Text>,
  IAvatarFallbackTextProps
>(({ className, size, ...props }, ref) => {
  return (
    <Text
      className={avatarFallbackTextStyle({ size, class: className })}
      {...props}
      ref={ref}
    />
  );
});

const AvatarBadge = React.forwardRef<
  React.ElementRef<typeof View>,
  IAvatarBadgeProps
>(({ className, size, ...props }, ref) => {
  return (
    <View
      className={avatarBadgeStyle({ size, class: className })}
      {...props}
      ref={ref}
    />
  );
});

const AvatarGroup = React.forwardRef<
  React.ElementRef<typeof View>,
  IAvatarGroupProps
>(({ className, ...props }, ref) => {
  return (
    <View
      className={avatarGroupStyle({ class: className })}
      {...props}
      ref={ref}
    />
  );
});

Avatar.displayName = 'Avatar';
AvatarImage.displayName = 'AvatarImage';
AvatarFallbackText.displayName = 'AvatarFallbackText';
AvatarBadge.displayName = 'AvatarBadge';
AvatarGroup.displayName = 'AvatarGroup';

export { Avatar, AvatarBadge, AvatarFallbackText, AvatarGroup, AvatarImage };

