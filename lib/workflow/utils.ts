import { Location, Source } from '.'

export function createLocation(source: Source, position: number): Location {
  const lineRegexp = /\r\n|[\n\r]/g
  let line = 1
  let column = position + 1
  let match = lineRegexp.exec(source.input)

  while (match && match.index < position) {
    line += 1
    column = position + 1 - (match.index + match[0].length)
    match = lineRegexp.exec(source.input)
  }

  return {
    line,
    position,
    column,
  }
}
