import { css } from 'astroturf'
import cx from 'classnames'
import React from 'react'

const s = css`
  .container {
    border: 2px dashed #ccc;
    /* CARD_WIDTH */
    width: 250px;
    /* CARD_HEIGHT */
    height: 200px;
    position: absolute;
    border-radius: 10px;

    &.active {
      border-color: #3575d7;
    }
  }
`

interface WorkflowCardComposerProps {
  readonly x: number
  readonly y: number
  readonly dispatch: (action: any) => any
  readonly active?: boolean
}

const WorkflowCardComposer: React.SFC<WorkflowCardComposerProps> = ({
  x,
  y,
  dispatch,
  active,
}) => {
  const handleMouseEnter = () => {
    dispatch({
      type: 'SET_COMPOSER_MOUSE_OVER',
      payload: true,
    })
  }
  const handleMouseLeave = () => {
    dispatch({
      type: 'SET_COMPOSER_MOUSE_OVER',
      payload: false,
    })
  }

  return (
    <div
      style={{ top: y, left: x }}
      className={cx(s.container, active ? s.active : '')}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    />
  )
}

WorkflowCardComposer.displayName = 'WorkflowCardComposer'

export default WorkflowCardComposer
