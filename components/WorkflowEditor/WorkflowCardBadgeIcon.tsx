import React from 'react'
import Cloud from 'react-feather/dist/icons/cloud'
import Package from 'react-feather/dist/icons/package'
import Icon from '../Icon'

interface WorkflowCardBadgeIconProps {
  readonly className?: string
  readonly name: string
}

const WorkflowCardBadgeIcon: React.SFC<WorkflowCardBadgeIconProps> = ({
  className,
  name,
}) => {
  if (name === 'package') {
    return <Package className={className} color="#fff" />
  }

  if (name === 'cloud') {
    return <Cloud className={className} color="#fff" />
  }

  return <Icon className={className} name={name} />
}

WorkflowCardBadgeIcon.displayName = 'WorkflowCardBadgeIcon'

export default WorkflowCardBadgeIcon
