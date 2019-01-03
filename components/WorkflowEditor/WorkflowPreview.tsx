// @ts-nocheck
import { css, Stylesheet } from 'astroturf'
import React, { useMemo } from 'react'
import { WorkflowNodeKind } from '~/lib/workflow'
import { CARD_HEIGHT, CARD_WIDTH } from './constants'
import { calculateNodeY } from './utils'
import WorkflowCard from './WorkflowCard'
import WorkflowCardComposer from './WorkflowCardComposer'
import WorkflowConnection from './WorkflowConnection'
import { WorkflowEditorState } from './WorkflowEditor'

const s: Stylesheet<'container'> = css`
  .container {
    padding: var(--workflow-margin);
    background: #ececf3;
    width: 100%;
    height: 100%;
    overflow: auto;
  }
`

interface WorkflowPreviewProps {
  readonly ref: any
  readonly state: WorkflowEditorState
  readonly dispatch: (action: any) => any
}

const WorkflowPreview: React.SFC<WorkflowPreviewProps> = React.forwardRef(
  ({ state, dispatch }, ref) => {
    if (!state.document) {
      return null
    }

    const focusedNode = state.focusedNodeId
      ? state.document.nodesMap[state.focusedNodeId]
      : undefined

    const [farthestXPos, farthestYPos] = useMemo(
      () => {
        let fx = 0
        let fy = 0

        state.document!.nodes.forEach(node => {
          if (node.x > fx) {
            fx = node.x
          }

          if (node.y > fy) {
            fy = node.y
          }
        })

        return [fx, fy]
      },
      [state.document.nodes.length],
    )

    return (
      <div ref={ref as any} className={s.container}>
        <div
          className="pos-relative"
          style={{
            minWidth: farthestXPos + CARD_WIDTH + 500,
            minHeight: farthestYPos + CARD_HEIGHT + 500,
          }}
        >
          {state.document.nodes.map(node =>
            node.resolves.map(nextNodeId => {
              const { currentReport } = state
              const task = currentReport && currentReport.map[nextNodeId]
              let failed: boolean | undefined = false
              let n = node

              // Check if one parent has failed
              do {
                failed =
                  currentReport &&
                  currentReport.map[n.id] &&
                  currentReport.map[n.id].failed

                if (n.kind === WorkflowNodeKind.Workflow || !n.resolvedBy) {
                  break
                }

                n = n.resolvedBy
              } while (!failed && n && n.index !== 0)

              return (
                <WorkflowConnection
                  key={node.id + state.document!.nodesMap[nextNodeId].id}
                  nodeKind={node.kind}
                  sourceX={node.x}
                  sourceY={calculateNodeY(node, state.readOnly)}
                  targetX={state.document!.nodesMap[nextNodeId].x}
                  targetY={calculateNodeY(
                    state.document!.nodesMap[nextNodeId],
                    state.readOnly,
                  )}
                  readOnly={state.readOnly}
                  color={
                    task && task.payload ? '#999' : failed ? '#ccc' : undefined
                  }
                />
              )
            }),
          )}
          {!state.readOnly && state.newConnectionPos && focusedNode && (
            <WorkflowConnection
              nodeKind={focusedNode.kind}
              sourceX={focusedNode.x}
              sourceY={focusedNode.y}
              targetX={state.newConnectionPos.x}
              targetY={state.newConnectionPos.y}
            />
          )}
          {state.document.nodes.map(node => (
            <WorkflowCard
              key={node.id}
              node={node}
              dispatch={dispatch}
              readOnly={state.readOnly}
              task={state.currentReport && state.currentReport.map[node.id]}
            />
          ))}
          {!state.readOnly && focusedNode && state.composerPosition && (
            <WorkflowCardComposer
              dispatch={dispatch}
              active={state.composerMouseOver}
              x={state.composerPosition.x}
              y={state.composerPosition.y}
            />
          )}
        </div>
      </div>
    )
  },
)

WorkflowPreview.displayName = 'WorkflowPreview'

export default WorkflowPreview
