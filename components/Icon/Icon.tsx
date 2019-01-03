import React from 'react'

export interface IconProps {
  name: string
  className?: string
  style?: React.CSSProperties
}

const Icon: React.SFC<IconProps> = ({ name, className, ...props }) => (
  <span className={`icon im${className ? ` ${className}` : ''}`} {...props}>
    {name}
  </span>
)
Icon.displayName = 'Icon'

export default Icon
