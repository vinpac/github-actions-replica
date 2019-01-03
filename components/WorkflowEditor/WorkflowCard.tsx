import { css, Stylesheet } from 'astroturf'
import cx from 'classnames'
import React, { useRef } from 'react'
import useMouseMovement from '~/lib/hooks/use-mouse-movement'
import { DocumentNode, Task, WorkflowNodeKind } from '~/lib/workflow'
import Icon from '../Icon'
import { calculateNodeY } from './utils'
import WorkflowCardBadgeIcon from './WorkflowCardBadgeIcon'

const s: Stylesheet<
  | 'description'
  | 'container'
  | 'body'
  | 'header'
  | 'status'
  | 'connected'
  | 'badge'
  | 'badgeIcon'
  | 'connector'
  | 'title'
  | 'propsTable'
  | 'propKey'
  | 'controls'
  | 'runningIndicator'
  | 'kind--workflow'
  | 'read-only'
  | 'failed'
> = css`
  .container {
    background: #fff;
    border-radius: 10px;
    width: var(--workflow-card-width);
    height: var(--workflow-card-height);
    box-shadow: 0 1px 1px 0 rgba(0, 0, 0, 0.1), 0 0 1px 1px rgba(0, 0, 0, 0.1);
    position: absolute;
    z-index: 2;
    display: flex;
    flex-direction: column;
    z-index: 100;

    &.connected::before {
      background: #fff;
      border-radius: 50%;
      top: -10px;
      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.15);
      content: '';
      display: block;
      height: 20px;
      left: 0;
      right: 0;
      margin: 0 auto;
      position: absolute;
      width: 20px;
    }

    &::after {
      background: #fff;
      border-radius: 50%;
      bottom: -10px;
      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.15);
      content: '';
      display: block;
      height: 20px;
      left: 0;
      right: 0;
      margin: 0 auto;
      position: absolute;
      width: 20px;
    }

    &.kind--workflow {
      background: #3d4447;
      color: #fff;
      height: var(--workflow-card-trigger-height);

      &::before,
      &::after {
        background: #3d4447;
      }
    }

    &.read-only {
      height: var(--workflow-card-read-only-height);
    }

    &.failed {
      box-shadow: 0 0 0 2px #ff5b5b;
    }
  }

  .body {
    font-size: 14px;
    flex: 1 1 auto;
    cursor: -webkit-grab;
    background: #fff;
    position: relative;
    border-radius: 10px;

    .kind--workflow & {
      background: #3d4447;
    }

    .read-only & {
      cursor: default;
    }
  }

  .header {
    border-bottom: 1px solid #ddd;
    background: #f2f6f9;
    min-height: 4rem;
    border-radius: 10px 10px 0 0;
    user-select: none;

    .read-only & {
      background: none;
      border-bottom: 0;
    }
  }

  .title {
    font-size: 14px;
    font-weight: 500;
    margin: 0;
    line-height: 1.4;
  }

  .description {
    font-weight: normal;
    color: #999;
    font-size: 13px;
    margin: 0;
  }

  .status {
    font-weight: normal;
    color: #666;
    font-size: 13px;
    margin: 0;

    &::before {
      content: '';
      width: 10px;
      height: 10px;
      display: inline-block;
      border-radius: 50%;
      margin-right: 5px;
    }

    &.status-running {
      font-style: italic;

      &::before {
        background: #e6b82c;
      }
    }

    &.status-pending::before {
      background: #999;
    }

    &.status-succeeded::before,
    &.status-failed::before {
      display: none;
    }

    &.status-succeeded > .icon {
      color: #2aac69;
    }

    &.status-failed > .icon {
      color: #ff1818;
    }

    > .icon {
      margin-right: 5px;
    }
  }

  .controls {
    border-top: 1px solid rgba(0, 0, 0, 0.1);
    min-height: 30px;
    padding: 2px 12px;

    .kind--workflow & {
      border-top: 1px solid rgba(0, 0, 0, 0.2);
    }

    &::after {
      content: '';
      background: #fff;
      width: 24px;
      height: 12px;
      left: 0;
      right: 0;
      position: absolute;
      z-index: 3;
      bottom: 0;
      margin: auto;
    }

    .kind--workflow &::after {
      background: #3d4447;
    }

    .read-only & {
      border-top-width: 0;
      min-height: 0;
    }
  }

  .connector {
    position: absolute;
    width: 10px;
    height: 10px;
    background: #999;
    padding: 0;
    border: 0;
    border-radius: 50%;
    left: 0;
    right: 0;
    bottom: -5px;
    margin: auto;
    z-index: 10;
    cursor: pointer;
    outline: none !important;

    &.active,
    &.connected,
    &:hover {
      background: #3575d7;
    }

    &.connected {
      top: -5px;
      bottom: auto;
    }
  }

  .badge {
    box-shadow: 0 1px 7px rgba(27, 31, 35, 0.15) !important;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    background: #f85a40;
    float: right;
    position: relative;
    text-align: center;
  }

  .badgeIcon {
    font-size: 24px;
    color: #fff;
    margin: 2px 0;
  }

  svg.badgeIcon {
    margin: 7px 0;
  }

  .runningIndicator {
    width: 50px;
    height: 50px;
    position: absolute;
    left: -5px;
    top: -5px;
  }

  .propsTable {
    margin: 12px;
    padding: 0;
    max-height: 100px;
    overflow: hidden;
  }

  .propKey {
    color: #586069;
    padding-right: 12px;
  }
`

interface WorkflowCardProps {
  readonly className?: string
  readonly node: DocumentNode
  readonly dispatch: (action: any) => any
  readonly readOnly?: boolean
  readonly task?: Task
}

const messages = {
  failed: 'Failed',
  running: 'In progress...',
  succeeded: 'Succeeded',
  pending: 'Pending',
}
const WorkflowCard: React.SFC<WorkflowCardProps> = ({
  readOnly,
  className,
  node,
  dispatch,
  task,
}) => {
  const parentNode = node.kind === WorkflowNodeKind.Action && node.resolvedBy
  const handleNewConnectionMouseDown = useMouseMovement(
    event => {
      if (readOnly) {
        return
      }

      dispatch({
        type: 'NEW_CONNECTION',
        payload: {
          x: event.pageX,
          y: event.pageY,
        },
        meta: {
          id: node.id,
        },
      })
    },
    event => {
      if (readOnly) {
        return
      }

      dispatch({
        type: 'FINISH_NEW_CONNECTION',
        payload: {
          x: event.pageX,
          y: event.pageY,
        },
        meta: {
          id: node.id,
        },
      })
    },
  )
  const pos = useRef<number>(0)
  const handleCardMouseDown = useMouseMovement(event => {
    if (readOnly) {
      return
    }

    let x = Math.max(0, node.x + event.movementX)

    if (x > 0 && parentNode) {
      const diff = Math.abs(parentNode.x - node.x)
      const out = Math.abs(pos.current)

      if (diff <= 10) {
        if (out > 10) {
          x += pos.current
          pos.current = 0
        } else {
          pos.current += event.movementX
          x = parentNode.x
        }
      }
    }

    dispatch({
      type: 'CHANGE',
      payload: {
        y: Math.max(0, node.y + event.movementY),
        x,
      },
      meta: {
        id: node.id,
      },
    })
  })
  let status = 'pending'
  if (task) {
    if (task.running) {
      status = 'running'
    } else {
      status = task.failed ? 'failed' : 'succeeded'
    }
  }

  return (
    <div
      className={cx(s.container, className, {
        [s['read-only']]: readOnly,
        [s['kind--workflow']]: node.kind === WorkflowNodeKind.Workflow,
        [s.connected]: parentNode,
        [s.failed]: task && task.failed,
      })}
      style={{
        top: calculateNodeY(node, readOnly),
        left: node.x,
      }}
    >
      {parentNode && <button className={`${s.connector} ${s.connected}`} />}
      <div className={s.body} onMouseDown={handleCardMouseDown}>
        {node.kind !== WorkflowNodeKind.Workflow ? (
          <div className={`${s.header} p-2`}>
            <div className={s.badge} style={{ background: node.action.color }}>
              <WorkflowCardBadgeIcon
                className={s.badgeIcon}
                name={node.action.icon}
              />
              {task && task.running && (
                <svg
                  className={s.runningIndicator}
                  width="120"
                  height="120"
                  viewBox="0 0 120 120"
                >
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="#d7daa8"
                    strokeWidth="5"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="#dab520"
                    strokeWidth="5"
                    strokeDasharray="339.292"
                    strokeDashoffset="230"
                  >
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from="0 60 60"
                      to="360 60 60"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                  </circle>
                </svg>
              )}
            </div>

            <h3 className={`${s.title} text-truncate`}>
              {node.label || node.id}
            </h3>
            {readOnly ? (
              <span className={`${s.status} ${s[`status-${status}`]}`}>
                {status === 'succeeded' ? <Icon name="check" /> : ''}
                {status === 'failed' ? <Icon name="close" /> : ''}
                {messages[status]}0
                {task && task.payload && (
                  <>
                    <span className="tc-muted"> . </span>
                    <a href=".">Log</a>
                  </>
                )}
              </span>
            ) : (
              <span className={`${s.description} text-truncate`}>
                {node.uses}
              </span>
            )}
          </div>
        ) : (
          <div className="p-2">
            <h3 className={`${s.title} text-truncate`}>
              {node.label || node.id}
            </h3>
            <h5 className="tw-normal tc-light ts-small text-truncate">
              on {node.on}
            </h5>
          </div>
        )}
        {!readOnly && node.kind === WorkflowNodeKind.Action && (
          <table className={s.propsTable}>
            <tbody>
              {node.uses && (
                <tr>
                  <td className={s.propKey}>uses</td>
                  <td>
                    <span className="text-truncate">{node.uses}</span>
                  </td>
                </tr>
              )}
              {Object.keys(node.props).map(key => (
                <tr key={key}>
                  <td className={s.propKey}>{key}</td>
                  <td>
                    <span className="text-truncate">
                      {typeof node.props[key] === 'object' ? (
                        <code>{JSON.stringify(node.props[key])}</code>
                      ) : (
                        node.props[key]
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className={`${s.controls} ta-right`}>
        <button
          type="button"
          className={`ts-small btn btn-plain-text ${
            node.kind === WorkflowNodeKind.Action ? 'tc-link' : 'tc-white'
          }`}
        >
          Edit
        </button>
        <button
          type="button"
          onMouseDown={handleNewConnectionMouseDown}
          className={cx(
            s.connector,
            node.resolves.length ? 'active' : undefined,
          )}
        />
      </div>
    </div>
  )
}

WorkflowCard.displayName = 'WorkflowCard'

export default React.memo(WorkflowCard)
