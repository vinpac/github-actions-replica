import * as React from 'react'
import { WorkflowNodeKind } from '~/lib/workflow'
import {
  CARD_HEIGHT,
  CARD_READ_ONLY_HEIGHT,
  CARD_TRIGGER_HEIGHT,
  CARD_WIDTH,
} from './constants'

interface WorkflowConnectionProps {
  readonly nodeKind: WorkflowNodeKind
  readonly sourceX: number
  readonly sourceY: number
  readonly targetX: number
  readonly targetY: number
  readonly readOnly?: boolean
  readonly color?: string
}

const HALF_CARD_WIDTH = CARD_WIDTH / 2
const WorkflowConnection: React.SFC<WorkflowConnectionProps> = ({
  nodeKind,
  sourceX,
  sourceY: sourceYBase,
  targetX,
  targetY,
  readOnly,
  color,
}) => {
  // Move the sourceY point if the source is a trigger
  const fromY = readOnly
    ? sourceYBase - (CARD_HEIGHT - CARD_READ_ONLY_HEIGHT)
    : nodeKind === WorkflowNodeKind.Workflow
      ? sourceYBase - (CARD_HEIGHT - CARD_TRIGGER_HEIGHT)
      : sourceYBase
  const dx = Math.min(0, targetX - sourceX) * -1
  const dy = Math.min(0, targetY - (fromY + 20 + CARD_HEIGHT)) * -1
  const endX = targetX - sourceX + dx + HALF_CARD_WIDTH

  return (
    <svg
      style={{
        position: 'absolute',
        width:
          sourceX > targetX
            ? sourceX - targetX + CARD_WIDTH
            : targetX - sourceX + CARD_WIDTH,
        height: Math.max(
          40,
          fromY + CARD_HEIGHT > targetY
            ? fromY - targetY + CARD_HEIGHT
            : targetY - fromY - CARD_HEIGHT,
        ),
        marginLeft: dx * -1,
        marginTop: dy * -1,
        left: sourceX,
        top: fromY + CARD_HEIGHT,
      }}
    >
      <path
        d={`
          M ${dx + HALF_CARD_WIDTH} ${dy}
          C ${dx + HALF_CARD_WIDTH},50 ${endX},${-20} ${endX},${targetY -
          fromY -
          CARD_HEIGHT +
          dy}
`}
        fill="none"
        stroke={color}
        strokeWidth={4}
      />
    </svg>
  )
}

WorkflowConnection.displayName = 'WorkflowConnection'
WorkflowConnection.defaultProps = {
  color: '#bbb',
}

export default React.memo(WorkflowConnection)
