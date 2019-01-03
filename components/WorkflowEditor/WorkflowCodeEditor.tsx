import { css } from 'astroturf'
import CodeMirror, { EditorConfiguration } from 'codemirror'
import React, { memo, useCallback, useRef, useState } from 'react'
import { Controlled as CodeMirrorEditor } from 'react-codemirror2'
import { Action, WorkflowDocument } from '~/lib/workflow'
import WorkflowParserError from '~/lib/workflow/errors/WorkflowParserError'
import { parseWorkflow } from '~/lib/workflow/parser'
import transformWorkflowASTToDocument from '~/lib/workflow/transformer'
import { WorkflowEditorState } from './WorkflowEditor'

const s = css`
  .container {
    height: 100%;

    :global {
      .CodeMirror {
        height: 100%;
      }

      .CodeMirror-code {
        font-size: 14px;
      }

      .syntax-error {
        background: rgba(255, 47, 62, 0.18);
        box-shadow: 0 2px #ff5252;
        position: relative;
      }

      .syntax-action {
        background: #0069ff;
        color: #fff;
      }

      .cm-string {
        color: #28a745;
      }

      .cm-id {
        color: #0366d6;
      }

      .cm-keyword {
        color: #cb2431;
      }

      .cm-number {
        color: #ad21ff;
      }
    }
  }
`

const options: EditorConfiguration = {
  lineNumbers: true,
  theme: 'github-light',
  tabSize: 2,
  indentWithTabs: false,
  mode: 'workflow',
}

interface WorkflowModeState {
  depth: number
  scope?: 'action'
  expectNext?: 'id'
  lastChar?: string | null
}

const shouldSkipChar = (char: string | null) =>
  !char || char === ' ' || char === '\n' || char === '\t'
const mode: { name: string; fn: () => CodeMirror.Mode<any> } = {
  name: 'workflow',
  fn: () => ({
    indent: (state: WorkflowModeState) => {
      return state.depth * 2
    },
    startState: (): WorkflowModeState => ({ depth: 0 }),
    token: (stream, state: WorkflowModeState) => {
      let char = stream.peek()

      if (shouldSkipChar(char)) {
        do {
          stream.next()
          char = stream.peek()

          if (char === null || char === undefined) {
            return null
          }
        } while (shouldSkipChar(char))

        return null
      }

      if (!char) {
        state.lastChar = undefined
        stream.next()
        return null
      }

      if (char === '{') {
        state.lastChar = undefined
        stream.next()
        state.depth += 1
        return null
      }

      if (char === '}') {
        state.lastChar = undefined
        stream.next()
        state.depth -= 1
        state.scope = undefined
        return null
      }

      if (char === '"' || char === "'") {
        state.lastChar = undefined
        stream.next()
        const quote = char
        char = stream.next()

        while (char && char !== quote) {
          if (char === '\\') {
            stream.next()
          }

          char = stream.next()
        }

        if (state.expectNext === 'id') {
          state.expectNext = undefined
          return 'id'
        }

        return 'string'
      }

      let name: string = ''
      let isNumber: boolean = false
      while (true) {
        const charCode = char && char.charCodeAt(0)
        const isNumberChar = charCode && charCode >= 48 && charCode <= 57
        if (isNumberChar && !name.length) {
          isNumber = true
        }

        if (
          charCode &&
          ((charCode >= 65 && charCode <= 122 && !isNumber) ||
            ((name.length || isNumber) && isNumberChar) ||
            (isNumber && charCode === 46))
        ) {
          name += char
          stream.next()
          char = stream.peek()
        } else {
          break
        }
      }

      if (name === 'action' || name === 'workflow') {
        state.lastChar = undefined
        state.scope = 'action'
        state.expectNext = 'id'
        return 'keyword'
      }

      if (name && isNumber) {
        state.lastChar = undefined
        return 'number'
      }

      if (name && state.expectNext === 'id') {
        state.lastChar = undefined
        state.expectNext = undefined
        return 'id'
      }

      if (name && state.depth > 0 && state.lastChar === '=') {
        state.lastChar = undefined
        return 'id'
      }

      state.lastChar = char

      stream.next()
      return null
    },
  }),
}

interface WorkflowCodeEditorProps {
  readonly state: WorkflowEditorState
  readonly dispatch: (action: any) => any
  readonly actionsMap: { [id: string]: Action }
}

interface WorkflowCodeEditorState {
  readonly value: string
}
const WorkflowCodeEditor: React.SFC<WorkflowCodeEditorProps> = ({
  state: editorState,
  dispatch,
  actionsMap,
}) => {
  const [state, setState] = useState<WorkflowCodeEditorState>({
    value: editorState.value,
  })
  const changeTimeoutRef = useRef<number | undefined>(undefined)
  const marksInstances = useRef<CodeMirror.TextMarker[]>([])

  const updateMarks = useCallback((editor, parserError?: Error) => {
    marksInstances.current = marksInstances.current.filter(mark => mark.clear())
    const doc = editor as CodeMirror.Doc

    if (parserError && parserError instanceof WorkflowParserError) {
      marksInstances.current = [
        doc.markText(
          {
            line: parserError.start.line - 1,
            ch: parserError.start.column - 1,
          },
          {
            line: parserError.end.line - 1,
            ch:
              parserError.start.column === parserError.end.column
                ? parserError.end.column
                : parserError.end.column - 1,
          },
          {
            className: 'syntax-error',
            title: parserError.message,
          },
        ),
      ]
    }
  }, [])
  const handleBeforeChange = useCallback(
    (_, __, newValue: string) => {
      setState({ ...state, value: newValue })
    },
    [state.value],
  )

  const handleChange = useCallback(
    editor => {
      clearTimeout(changeTimeoutRef.current)
      changeTimeoutRef.current = window.setTimeout(() => {
        let document: WorkflowDocument | undefined
        let parserError: Error | undefined

        try {
          document = transformWorkflowASTToDocument(
            parseWorkflow(state.value),
            actionsMap,
          )

          updateMarks(editor)
        } catch (error) {
          parserError = error

          // Mark code texts with error
          if (!(error instanceof WorkflowParserError)) {
            console.error(error)
          }

          updateMarks(editor, error)
        }

        dispatch({
          type: 'UPDATE',
          payload: {
            value: state.value,
            document,
            parserError,
          },
        })
      }, 100)
    },
    [state.value],
  )

  const handleEditorMount = useCallback(editor => {
    updateMarks(editor, editorState.parserError)
  }, [])

  return (
    <CodeMirrorEditor
      className={s.container}
      value={state.value}
      onBeforeChange={handleBeforeChange}
      onChange={handleChange}
      editorDidMount={handleEditorMount}
      options={options}
      defineMode={mode}
    />
  )
}

WorkflowCodeEditor.displayName = 'WorkflowCodeEditor'

export default memo(WorkflowCodeEditor)
