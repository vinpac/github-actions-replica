import { Source, ValuedToken } from '..'
import { Token } from '..'
import { createLocation } from '../utils'
import WorkflowParserError from './WorkflowParserError'

export class WorkflowUnexpectedError extends WorkflowParserError {
  constructor(source: Source, token: Token, expected?: string) {
    const location = createLocation(source, token.start)
    const { kind, value } = token as ValuedToken

    super(
      source,
      token.start,
      token.end,
      `${expected ? `Expected ${expected}, found` : 'Unexpected'} ` +
        `${kind}${value ? ` "${value}"` : ''}` +
        `${source.name ? ` at ${source.name}` : ''} (${location.line}:${
          location.column
        })`,
    )

    this.name = 'ParserUnexpectedError'
  }
}
