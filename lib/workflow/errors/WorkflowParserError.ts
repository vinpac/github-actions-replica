import { Location, Source } from '..'
import { createLocation } from '../utils'

export default class WorkflowParserError extends Error {
  public source: Source
  public message: string
  public start: Location
  public end: Location

  constructor(source: Source, start: number, end: number, message?: string) {
    super(message)

    this.name = 'WorkflowParserError'
    this.source = source
    this.message = message || 'Parser Error'
    this.start = createLocation(source, start)
    this.end = createLocation(source, end)
  }

  public toJSON() {
    return {
      name: this.name,
      source: this.source,
      message: this.message,
    }
  }
}
