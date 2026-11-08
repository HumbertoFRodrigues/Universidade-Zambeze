import * as React from "react"

export const Image = React.forwardRef(({ src, alt = "", className, ...props }, ref) => (
  <img
    ref={ref}
    src={src}
    alt={alt}
    className={className}
    loading="lazy"
    {...props}
  />
))

Image.displayName = "Image"