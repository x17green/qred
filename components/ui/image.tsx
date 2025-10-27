import React from 'react';
import { Image as RNImage, ImageProps as RNImageProps } from 'react-native';

type IImageProps = RNImageProps & {
  className?: string;
  alt?: string;
};

export const Image = React.forwardRef<
  React.ElementRef<typeof RNImage>,
  IImageProps
>(({ className, alt, style, ...props }, ref) => {
  return (
    <RNImage
      ref={ref}
      style={style}
      accessibilityLabel={alt}
      {...props}
    />
  );
});

Image.displayName = 'Image';
