import React from 'react';
import { View, ViewProps, TextInput, TextInputProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const inputVariants = cva(
  "border-background-300 flex-row overflow-hidden content-center data-[hover=true]:border-outline-400 data-[focus=true]:border-primary-700 data-[focus=true]:hover:border-primary-700 data-[disabled=true]:opacity-40 data-[disabled=true]:hover:border-background-300 items-center",
  {
    variants: {
      size: {
        xl: "h-12",
        lg: "h-11",
        md: "h-10",
        sm: "h-9",
      },
      variant: {
        underlined: "rounded-none border-b data-[invalid=true]:border-b-2 data-[invalid=true]:border-error-700 data-[invalid=true]:hover:border-error-700 data-[invalid=true]:data-[focus=true]:border-error-700 data-[invalid=true]:data-[focus=true]:hover:border-error-700 data-[invalid=true]:data-[disabled=true]:hover:border-error-700",
        outline: "rounded border data-[invalid=true]:border-error-700 data-[invalid=true]:hover:border-error-700 data-[invalid=true]:data-[focus=true]:border-error-700 data-[invalid=true]:data-[focus=true]:hover:border-error-700 data-[invalid=true]:data-[disabled=true]:hover:border-error-700 data-[focus=true]:ring-1 data-[focus=true]:ring-inset data-[focus=true]:ring-primary-300",
        rounded: "rounded-full border data-[invalid=true]:border-error-700 data-[invalid=true]:hover:border-error-700 data-[invalid=true]:data-[focus=true]:border-error-700 data-[invalid=true]:data-[focus=true]:hover:border-error-700 data-[invalid=true]:data-[disabled=true]:hover:border-error-700 data-[focus=true]:ring-1 data-[focus=true]:ring-inset data-[focus=true]:ring-primary-300",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "outline",
    },
  }
);

const inputFieldVariants = cva(
  "flex-1 text-typography-900 py-0 px-3 placeholder:text-typography-500 h-full",
  {
    variants: {
      variant: {
        underlined: "outline-0 px-0",
        outline: "outline-0",
        rounded: "outline-0 px-4",
      },
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
    },
    defaultVariants: {
      variant: "outline",
      size: "md",
    },
  }
);

interface InputProps extends ViewProps, VariantProps<typeof inputVariants> {
  className?: string;
  isInvalid?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
}

interface InputFieldProps extends TextInputProps, VariantProps<typeof inputFieldVariants> {
  className?: string;
  type?: 'text' | 'password';
}

interface InputIconProps {
  as: React.ComponentType<any>;
  className?: string;
  size?: '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

interface InputSlotProps extends ViewProps {
  className?: string;
}

const Input = React.forwardRef<View, InputProps>(
  ({ className, variant, size, isInvalid, isDisabled, isReadOnly, ...props }, ref) => {
    return (
      <View
        ref={ref}
        className={cn(inputVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);

const InputField = React.forwardRef<TextInput, InputFieldProps>(
  ({ className, variant, size, type = 'text', ...props }, ref) => {
    return (
      <TextInput
        ref={ref}
        className={cn(inputFieldVariants({ variant, size }), className)}
        secureTextEntry={type === 'password'}
        {...props}
      />
    );
  }
);

const InputIcon = React.forwardRef<any, InputIconProps>(
  ({ as: Component, className, size = 'md', ...props }, ref) => {
    const iconSizeClass = {
      '2xs': 'h-3 w-3',
      'xs': 'h-3.5 w-3.5',
      'sm': 'h-4 w-4',
      'md': 'h-[18px] w-[18px]',
      'lg': 'h-5 w-5',
      'xl': 'h-6 w-6',
    }[size];

    return (
      <Component
        ref={ref}
        className={cn('justify-center items-center text-typography-400 fill-none', iconSizeClass, className)}
        {...props}
      />
    );
  }
);

const InputSlot = React.forwardRef<View, InputSlotProps>(
  ({ className, ...props }, ref) => {
    return (
      <View
        ref={ref}
        className={cn('justify-center items-center', className)}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
InputField.displayName = 'InputField';
InputIcon.displayName = 'InputIcon';
InputSlot.displayName = 'InputSlot';

export { Input, InputField, InputIcon, InputSlot, inputVariants, inputFieldVariants };
