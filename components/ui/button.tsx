import React from 'react';
import { Pressable, PressableProps, Text as RNText, TextProps as RNTextProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "rounded bg-primary-500 flex-row items-center justify-center data-[focus-visible=true]:outline-none data-[focus-visible=true]:ring-2 data-[disabled=true]:opacity-40 gap-2",
  {
    variants: {
      action: {
        primary: "bg-primary-500 data-[hover=true]:bg-primary-600 data-[active=true]:bg-primary-700 border-primary-300 data-[hover=true]:border-primary-400 data-[active=true]:border-primary-500 data-[focus-visible=true]:ring-primary-300",
        secondary: "bg-secondary-500 border-secondary-300 data-[hover=true]:bg-secondary-600 data-[hover=true]:border-secondary-400 data-[active=true]:bg-secondary-700 data-[active=true]:border-secondary-700",
        positive: "bg-success-500 border-success-300 data-[hover=true]:bg-success-600 data-[hover=true]:border-success-400 data-[active=true]:bg-success-700 data-[active=true]:border-success-500",
        negative: "bg-error-500 border-error-300 data-[hover=true]:bg-error-600 data-[hover=true]:border-error-400 data-[active=true]:bg-error-700 data-[active=true]:border-error-500",
        default: "bg-transparent data-[hover=true]:bg-background-50 data-[active=true]:bg-transparent",
      },
      variant: {
        link: "px-0",
        outline: "bg-transparent border data-[hover=true]:bg-background-50 data-[active=true]:bg-transparent",
        solid: "",
      },
      size: {
        xs: "px-3.5 h-8",
        sm: "px-4 h-9",
        md: "px-5 h-10",
        lg: "px-6 h-11",
        xl: "px-7 h-12",
      },
    },
    compoundVariants: [
      {
        action: "primary",
        variant: "link",
        class: "px-0 bg-transparent data-[hover=true]:bg-transparent data-[active=true]:bg-transparent",
      },
      {
        action: "secondary",
        variant: "link",
        class: "px-0 bg-transparent data-[hover=true]:bg-transparent data-[active=true]:bg-transparent",
      },
      {
        action: "positive",
        variant: "link",
        class: "px-0 bg-transparent data-[hover=true]:bg-transparent data-[active=true]:bg-transparent",
      },
      {
        action: "negative",
        variant: "link",
        class: "px-0 bg-transparent data-[hover=true]:bg-transparent data-[active=true]:bg-transparent",
      },
      {
        action: "primary",
        variant: "outline",
        class: "bg-transparent data-[hover=true]:bg-background-50 data-[active=true]:bg-transparent",
      },
      {
        action: "secondary",
        variant: "outline",
        class: "bg-transparent data-[hover=true]:bg-background-50 data-[active=true]:bg-transparent",
      },
      {
        action: "positive",
        variant: "outline",
        class: "bg-transparent data-[hover=true]:bg-background-50 data-[active=true]:bg-transparent",
      },
      {
        action: "negative",
        variant: "outline",
        class: "bg-transparent data-[hover=true]:bg-background-50 data-[active=true]:bg-transparent",
      },
    ],
    defaultVariants: {
      action: "primary",
      variant: "solid",
      size: "md",
    },
  }
);

const buttonTextVariants = cva(
  "text-typography-0 font-semibold",
  {
    variants: {
      action: {
        primary: "text-primary-600 data-[hover=true]:text-primary-600 data-[active=true]:text-primary-700",
        secondary: "text-typography-500 data-[hover=true]:text-typography-600 data-[active=true]:text-typography-700",
        positive: "text-success-600 data-[hover=true]:text-success-600 data-[active=true]:text-success-700",
        negative: "text-error-600 data-[hover=true]:text-error-600 data-[active=true]:text-error-700",
        default: "text-typography-600",
      },
      variant: {
        link: "data-[hover=true]:underline data-[active=true]:underline",
        outline: "",
        solid: "text-typography-0 data-[hover=true]:text-typography-0 data-[active=true]:text-typography-0",
      },
      size: {
        xs: "text-xs",
        sm: "text-sm",
        md: "text-base",
        lg: "text-lg",
        xl: "text-xl",
      },
    },
    compoundVariants: [
      {
        variant: "solid",
        action: "primary",
        class: "text-typography-0 data-[hover=true]:text-typography-0 data-[active=true]:text-typography-0",
      },
      {
        variant: "solid",
        action: "secondary",
        class: "text-typography-800 data-[hover=true]:text-typography-800 data-[active=true]:text-typography-800",
      },
      {
        variant: "solid",
        action: "positive",
        class: "text-typography-0 data-[hover=true]:text-typography-0 data-[active=true]:text-typography-0",
      },
      {
        variant: "solid",
        action: "negative",
        class: "text-typography-0 data-[hover=true]:text-typography-0 data-[active=true]:text-typography-0",
      },
      {
        variant: "outline",
        action: "primary",
        class: "text-primary-500 data-[hover=true]:text-primary-500 data-[active=true]:text-primary-500",
      },
      {
        variant: "outline",
        action: "secondary",
        class: "text-typography-500 data-[hover=true]:text-primary-600 data-[active=true]:text-typography-700",
      },
      {
        variant: "outline",
        action: "positive",
        class: "text-primary-500 data-[hover=true]:text-primary-500 data-[active=true]:text-primary-500",
      },
      {
        variant: "outline",
        action: "negative",
        class: "text-primary-500 data-[hover=true]:text-primary-500 data-[active=true]:text-primary-500",
      },
    ],
    defaultVariants: {
      action: "primary",
      variant: "solid",
      size: "md",
    },
  }
);

interface ButtonProps extends PressableProps, VariantProps<typeof buttonVariants> {
  className?: string;
  isDisabled?: boolean;
}

interface ButtonTextProps extends RNTextProps, VariantProps<typeof buttonTextVariants> {
  className?: string;
}

interface ButtonIconProps {
  as: React.ComponentType<any>;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const Button = React.forwardRef<React.ElementRef<typeof Pressable>, ButtonProps>(
  ({ className, action, variant, size, isDisabled, ...props }, ref) => {
    return (
      <Pressable
        ref={ref}
        className={cn(buttonVariants({ action, variant, size }), className)}
        disabled={isDisabled}
        {...props}
      />
    );
  }
);

const ButtonText = React.forwardRef<RNText, ButtonTextProps>(
  ({ className, action, variant, size, ...props }, ref) => {
    return (
      <RNText
        ref={ref}
        className={cn(buttonTextVariants({ action, variant, size }), className)}
        {...props}
      />
    );
  }
);

const ButtonIcon = React.forwardRef<any, ButtonIconProps>(
  ({ as: Component, className, size = 'md', ...props }, ref) => {
    const iconSizeClass = {
      xs: 'h-3.5 w-3.5',
      sm: 'h-4 w-4',
      md: 'h-[18px] w-[18px]',
      lg: 'h-[18px] w-[18px]',
      xl: 'h-5 w-5',
    }[size];

    return (
      <Component
        ref={ref}
        className={cn('fill-none', iconSizeClass, className)}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
ButtonText.displayName = 'ButtonText';
ButtonIcon.displayName = 'ButtonIcon';

export { Button, ButtonText, ButtonIcon, buttonVariants, buttonTextVariants };
