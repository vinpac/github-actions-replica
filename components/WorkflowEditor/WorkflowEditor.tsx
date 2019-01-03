import { css } from 'astroturf'
import has from 'has'
import React, { useMemo, useReducer } from 'react'
import { generateRandomId } from '~/lib/utils/string'
import {
  Action,
  ActionNode,
  RunReport,
  Task,
  WorkflowDocument,
  WorkflowNodeKind,
} from '~/lib/workflow'
import WorkflowParserError from '~/lib/workflow/errors/WorkflowParserError'
import { parseWorkflow } from '~/lib/workflow/parser'
import transformWorkflowASTToDocument, {
  workflowDocumentToString,
} from '~/lib/workflow/transformer'
import { CARD_HEIGHT, CARD_WIDTH, MARGIN } from './constants'
import { Position } from './constants'
import WorkflowCodeEditor from './WorkflowCodeEditor'
import WorkflowEditorHeader from './WorkflowEditorHeader'
import WorkflowPreview from './WorkflowPreview'

const s = css`
  .container {
    height: 100vh;
    position: relative;
  }

  .sidebar {
    width: 300px;
    box-shadow: 1px 0 rgba(0, 0, 0, 0.05);
    z-index: 2;
    position: absolute;
    top: var(--workflow-header-height);
    bottom: 0;
    right: 0;
  }

  .body {
    position: absolute;
    right: 300px;
    top: var(--workflow-header-height);
    bottom: 0;
    right: 300px;
    left: 0;
  }

  .error {
    position: fixed;
    bottom: 0;
    left: 0;
    background: #ff5252;
    color: #fff;
    left: 0;
    right: 300px;
    padding: 1px 5px;
    z-index: 10000;
    display: block;
  }
`

export enum WorkflowEditorPanel {
  Preview,
  Code,
}

export interface WorkflowEditorState {
  readonly readOnly?: boolean
  readonly value: string
  readonly document?: WorkflowDocument
  readonly composerMouseOver?: boolean
  readonly composerPosition?: Position
  readonly focusedNodeId?: string
  readonly newConnectionPos?: Position
  readonly containerRef?: HTMLDivElement | null
  readonly containerRect?: DOMRect | ClientRect
  readonly running?: boolean
  readonly currentReport?: RunReport
  readonly panel: WorkflowEditorPanel
  readonly parserError?: WorkflowParserError
}

const reducerMap: {
  [type: string]: (state: WorkflowEditorState, action) => WorkflowEditorState
} = {
  CHANGE: (state, action) => {
    const overrides = action.payload

    if (has(overrides, 'x')) {
      overrides._x = overrides.x
    }

    if (has(overrides, 'y')) {
      overrides._y = overrides.y
    }

    if (!state.document) {
      return state
    }

    if (!state.document.nodesMap[action.meta.id]) {
      return state
    }

    Object.assign(state.document.nodesMap[action.meta.id], overrides)

    return {
      ...state,
      document: {
        nodesMap: state.document.nodesMap,
        nodes: state.document.nodes.map(node => {
          if (node.id === action.meta.id) {
            return {
              ...node,
              ...overrides,
            }
          }

          return node
        }),
      },
    }
  },
  SET_CONTAINER_REF: (state, action) => ({
    ...state,
    containerRef: action.payload,
  }),
  NEW_CONNECTION: (state, action) => {
    if (!state.containerRef || !state.document) {
      return state
    }

    let { containerRect } = state

    if (!containerRect) {
      containerRect = state.containerRef.getBoundingClientRect()
    }

    const node = state.document.nodesMap[action.meta.id]
    const composerPosition = {
      y: node.y + CARD_HEIGHT + 50,
      x: node.x,
    }

    // If the node has children, position the next one next to them
    if (node.resolves.length) {
      const lastChild =
        state.document.nodesMap[node.resolves[node.resolves.length - 1]]
      composerPosition.x = lastChild.x + CARD_WIDTH + 50
      composerPosition.y = lastChild.y
    }

    // Check if the new card intersects any existent other
    let i = 0
    let redo = false
    while (true) {
      if (i === state.document.nodes.length) {
        if (redo) {
          i = 0
          redo = false
        } else {
          break
        }
      }

      const cNode = state.document.nodes[i]

      const intersectsX =
        composerPosition.x + CARD_WIDTH > cNode.x &&
        composerPosition.x <= cNode.x + CARD_WIDTH
      const intersectsY =
        composerPosition.y + CARD_HEIGHT > cNode.y &&
        composerPosition.y <= cNode.y + CARD_HEIGHT

      if (intersectsX && intersectsY) {
        redo = true
        if (intersectsX) {
          composerPosition.x = cNode.x + CARD_WIDTH + 50
        }

        if (composerPosition.x > node.x + CARD_WIDTH * 2 + 100) {
          composerPosition.y = cNode.y + CARD_HEIGHT + 50
          composerPosition.x = node.x
        }
      }

      i += 1
    }

    return {
      ...state,
      composerPosition,
      focusedNodeId: action.meta.id,
      containerRect,
      newConnectionPos: {
        x:
          action.payload.x -
          MARGIN -
          containerRect.left -
          CARD_WIDTH / 2 +
          state.containerRef.scrollLeft,
        y:
          action.payload.y -
          MARGIN -
          containerRect.top +
          state.containerRef.scrollTop,
      },
    }
  },
  FINISH_NEW_CONNECTION: (state, action) => {
    const {
      document,
      focusedNodeId,
      composerMouseOver,
      composerPosition,
    } = state

    if (!document) {
      return state
    }

    const {
      meta: { id: parentNodeId },
    } = action
    if (focusedNodeId && composerPosition && composerMouseOver) {
      const id = generateRandomId()
      const parentNode = document.nodesMap[parentNodeId]

      // @ts-ignore
      const newNode: ActionNode = {
        kind: WorkflowNodeKind.Action,
        uses: '',
        id,
        resolves: [],
        index: parentNode.index + 1,
        resolvedBy: parentNode,
        resolvedById: parentNode.id,
        props: {},
        x: composerPosition.x,
        y: composerPosition.y,
      }
      document.nodesMap[newNode.id] = newNode
      Object.assign(parentNode, {
        resolves: [...parentNode.resolves, newNode.id],
      })

      return {
        ...state,
        composerMouseOver: false,
        focusedNodeId: undefined,
        newConnectionPos: undefined,
        document: {
          ...document,
          nodes: [
            ...document.nodes.map(node => {
              if (node.id === parentNodeId) {
                return {
                  ...parentNode,
                }
              }

              return node
            }),
            newNode,
          ],
        },
      }
    }

    return {
      ...state,
      composerPosition: state.composerPosition,
      focusedNodeId: undefined,
      newConnectionPos: undefined,
    }
  },
  SET_COMPOSER_MOUSE_OVER: (state, action) => ({
    ...state,
    composerMouseOver: action.payload,
  }),
  SET_READONLY: (state, action) => ({
    ...state,
    readOnly: action.payload,
  }),
  START: (state, action) => {
    return {
      ...state,
      readOnly: true,
      running: true,
      currentReport: action.payload,
    }
  },
  ADD_TASK_TO_REPORT: (state, action) => {
    if (!state.currentReport) {
      return state
    }

    const { payload: task } = action
    const tasks = state.currentReport.tasks

    return {
      ...state,
      currentReport: {
        ...state.currentReport,
        tasks: [...tasks, task],
        map: {
          ...state.currentReport.map,
          [task.nodeId]: task,
        },
      },
    }
  },
  UPDATE_TASK: (state, action) => {
    if (!state.currentReport) {
      return state
    }

    const {
      meta: { id },
      payload: overrides,
    } = action
    let updatedTask: Task | undefined
    const tasks = state.currentReport.tasks.map(task => {
      if (task.id === id) {
        updatedTask = {
          ...task,
          ...overrides,
        } as Task

        return updatedTask
      }

      return task
    })
    const map = updatedTask
      ? { ...state.currentReport.map, [updatedTask.nodeId]: updatedTask }
      : state.currentReport.map

    return {
      ...state,
      currentReport: {
        ...state.currentReport,
        tasks,
        map,
      },
    }
  },

  SET_PANEL: (state, action) => {
    if (action.payload === WorkflowEditorPanel.Code) {
      return {
        ...state,
        panel: action.payload,
        value: state.document
          ? workflowDocumentToString(state.document)
          : state.value,
      }
    }

    return {
      ...state,
      panel: action.payload,
    }
  },

  // TODO: IMPROVE
  UPDATE: (state, action) => ({
    ...state,
    ...action.payload,
  }),
}

const reducer = (state: WorkflowEditorState, action): WorkflowEditorState => {
  if (reducerMap[action.type]) {
    return reducerMap[action.type](state, action)
  }

  return state
}

// const GQL_LIST_ACTIONS = gql`
//   query fetchActionsList($length: Int!) {
//     listActions(first: $length) {
//       edges {
//         node {
//           id
//           icon
//           name
//           description
//           color
//         }
//       }
//     }
//   }
// `

interface WorkflowEditorProps {
  readonly defaultValue: string
}

const WorkflowEditor: React.SFC<WorkflowEditorProps> = ({ defaultValue }) => {
  const listActionsQuery = {
    data: {
      listActions: {
        edges: [
          {
            node: {
              id: 'now',
              icon: 'cloud',
              name: 'GitHub Action for now',
              description: 'Wraps the npm CLI to enable common npm commands.',
              color: '#333',
            },
          },
          {
            node: {
              id: 'npm',
              icon: 'package',
              name: 'GitHub Action for npm',
              description: 'Wraps the npm CLI to enable common npm commands.',
              color: 'red',
            },
          },
        ],
      },
    },
  }
  const { actionsMap } = useMemo(
    () => {
      const map: { [id: string]: Action } = {}
      const list = listActionsQuery.data.listActions.edges.map(edge => {
        const action = {
          ...edge.node,
          id: `actions/${edge.node.id}`,
        }

        map[action.id] = action
        return action
      })

      return { actionsMap: map, actions: list }
    },
    [listActionsQuery.data],
  )

  const memoizedValue = useMemo(
    () => {
      try {
        const document = transformWorkflowASTToDocument(
          parseWorkflow(defaultValue),
          actionsMap,
        )

        return {
          document,
        }
      } catch (error) {
        return {
          parserError: error,
        }
      }
    },
    [defaultValue],
  )

  const [state, dispatch] = useReducer<WorkflowEditorState, any>(reducer, {
    ...memoizedValue,
    value: defaultValue,
    panel: WorkflowEditorPanel.Preview,
  })

  return (
    <div className={s.container}>
      {state.parserError && (
        <span className={s.error}>{state.parserError.message}</span>
      )}
      <WorkflowEditorHeader state={state} dispatch={dispatch} />
      <div className={s.sidebar} />
      <div className={s.body}>
        {!state.parserError && state.panel === WorkflowEditorPanel.Preview && (
          <WorkflowPreview
            ref={ref => {
              if (ref !== state.containerRef && ref) {
                dispatch({ type: 'SET_CONTAINER_REF', payload: ref })
              }
            }}
            state={state}
            dispatch={dispatch}
          />
        )}
        {(state.parserError || state.panel === WorkflowEditorPanel.Code) && (
          <WorkflowCodeEditor
            state={state}
            dispatch={dispatch}
            actionsMap={actionsMap}
          />
        )}
      </div>
    </div>
  )
}

WorkflowEditor.displayName = 'WorkflowEditor'

export default WorkflowEditor
