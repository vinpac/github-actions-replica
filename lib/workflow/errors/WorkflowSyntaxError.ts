import { Source } from '..'
import { createLocation } from '../utils'
import WorkflowParserError from './WorkflowParserError'

export default class WorkflowSyntaxError extends WorkflowParserError {
  constructor(
    source: Source,
    start: number,
    end: number,
    description?: string,
  ) {
    const location = createLocation(source, end)

    super(
      source,
      start,
      end,
      `Syntax error ${source.name || ''} (${location.line}:${
        location.column
      })` + `${description ? ` ${description}` : ''}`,
    )
  }
}
