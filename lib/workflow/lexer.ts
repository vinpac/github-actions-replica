import {
  Lexer,
  PlainToken,
  PlainTokenKind,
  Source,
  Token,
  ValuedToken,
  ValuedTokenKind,
} from '.'
import WorkflowSyntaxError from './errors/WorkflowSyntaxError'

function positionAfterWhiteSpaces(lexer: Lexer) {
  const { input } = lexer.source

  let { position, line } = lexer
  let code = input.charCodeAt(position)

  while (
    position < input.length &&
    // \t
    (code === 9 ||
      // \n
      code === 10 ||
      // \r
      code === 13 ||
      // space
      code === 32 ||
      // ,
      code === 44)
  ) {
    if (code === 10 || code === 13) {
      line += 1
    }

    position += 1
    code = input.charCodeAt(position)
  }

  return { position, line }
}

function createToken(
  kind: PlainTokenKind,
  start: number,
  end: number,
  line: number,
  value?: string,
): PlainToken
function createToken(
  kind: ValuedTokenKind,
  start: number,
  end: number,
  line: number,
  value: string,
): ValuedToken
function createToken(
  kind: ValuedTokenKind | PlainTokenKind,
  start: number,
  end: number,
  line: number,
  value?: string,
): ValuedToken | PlainToken {
  if (value !== undefined) {
    return {
      kind,
      start,
      end,
      line,
      value,
    } as ValuedToken
  }

  return {
    kind,
    start,
    end,
    line,
  } as PlainToken
}

function readString(lexer: Lexer, start: number, line: number): Token {
  const input = lexer.source.input
  const quoteCode = input.charCodeAt(start)
  let position = start + 1
  let code = input.charCodeAt(position)
  let escaped = false
  let str = ''

  while (position < input.length) {
    if (code === quoteCode && !escaped) {
      break
    }

    if (escaped) {
      escaped = false
    }

    if (code === 92) {
      escaped = true
    }

    if (code === 10 || code === 13) {
      throw new WorkflowSyntaxError(
        lexer.source,
        start,
        position,
        'Untermined string',
      )
    }

    if (!escaped) {
      str += input.charAt(position)
    }

    position += 1
    code = input.charCodeAt(position)
  }

  const end = position + 1

  return createToken(ValuedTokenKind.STRING, start, end, line, str)
}

function readComment(lexer: Lexer, start: number, line: number): Token {
  const { input } = lexer.source
  let position = start
  let code

  do {
    position += 1
    code = input.charCodeAt(position)

    // not \n and not \r
  } while (position < input.length && code !== 10 && code !== 13)

  // Remove # from value
  const value = input.substr(start + 1, position - start - 1)

  return createToken(ValuedTokenKind.COMMENT, start, position, line, value)
}

function readName(lexer: Lexer, start: number, line: number): Token {
  const { input } = lexer.source
  let position = start
  let code

  do {
    position += 1
    code = input.charCodeAt(position)
  } while (
    position < input.length &&
    (code === 95 || // _
    (code >= 48 && code <= 57) || // 0-9
    (code >= 65 && code <= 90) || // A-Z
      (code >= 97 && code <= 122)) // a-z
  )

  return createToken(
    ValuedTokenKind.NAME,
    start,
    position,
    line,
    input.substr(start, position - start),
  )
}

function readToken(lexer: Lexer): Token {
  const {
    source: { input },
  } = lexer
  const { position, line } = positionAfterWhiteSpaces(lexer)

  // Reach the end of the input by skiping whitespaces
  if (position >= input.length) {
    if (lexer.lastToken.kind === PlainTokenKind.EOF) {
      return lexer.lastToken
    }

    return createToken(PlainTokenKind.EOF, position, position, line)
  }

  const code: number = input.charCodeAt(position)

  switch (code) {
    // "
    case 34:
    case 39:
      return readString(lexer, position, line)
    // #
    case 35:
      return readComment(lexer, position, line)
    // $
    case 36:
      return createToken(PlainTokenKind.DOLLAR, position, position + 1, line)
    // (
    case 40:
      return createToken(PlainTokenKind.PAREN_L, position, position + 1, line)
    // )
    case 41:
      return createToken(PlainTokenKind.PAREN_R, position, position + 1, line)
    // :
    case 58:
      return createToken(PlainTokenKind.COLON, position, position + 1, line)
    // ;
    case 59:
      return createToken(PlainTokenKind.SEMICOLON, position, position + 1, line)
    // =
    case 61:
      return createToken(PlainTokenKind.EQUALS, position, position + 1, line)
    // {
    case 123:
      return createToken(PlainTokenKind.BRACE_L, position, position + 1, line)
    // }
    case 125:
      return createToken(PlainTokenKind.BRACE_R, position, position + 1, line)
    // A-Z _ a-z
    case 65:
    case 66:
    case 67:
    case 68:
    case 69:
    case 70:
    case 71:
    case 72:
    case 73:
    case 74:
    case 75:
    case 76:
    case 77:
    case 78:
    case 79:
    case 80:
    case 81:
    case 82:
    case 83:
    case 84:
    case 85:
    case 86:
    case 87:
    case 88:
    case 89:
    case 90:
    case 95:
    case 97:
    case 98:
    case 99:
    case 100:
    case 101:
    case 102:
    case 103:
    case 104:
    case 105:
    case 106:
    case 107:
    case 108:
    case 109:
    case 110:
    case 111:
    case 112:
    case 113:
    case 114:
    case 115:
    case 116:
    case 117:
    case 118:
    case 119:
    case 120:
    case 121:
    case 122:
      return readName(lexer, position, line)
    // - . 0-9
    case 45:
    case 46:
    case 48:
    case 49:
    case 50:
    case 51:
    case 52:
    case 53:
    case 54:
    case 55:
    case 56:
    case 57:
      return readNumber(lexer, position, line)

    default:
      throw new WorkflowSyntaxError(
        lexer.source,
        position,
        position,
        `"${input.charAt(position)}", char code: ${code}`,
      )
  }
}

function readNumber(lexer: Lexer, start: number, line: number): Token {
  const { input } = lexer.source
  let position = start + 1
  let code = input.charCodeAt(position)
  let isFloat = input.charCodeAt(start) === 46

  // If starts with a dot and not nexted by a number throw error
  if (isFloat && !(code >= 48 && code <= 57)) {
    throw new WorkflowSyntaxError(
      lexer.source,
      position,
      position,
      `Unexpected ${input.charAt(position)}`,
    )
  }

  while (
    position < input.length &&
    ((code >= 48 && code <= 57) || (code === 45 || code === 46))
  ) {
    if (!isFloat && code === 46) {
      isFloat = true
    }

    position += 1
    code = input.charCodeAt(position)
  }

  return createToken(
    isFloat ? ValuedTokenKind.FLOAT : ValuedTokenKind.INT,
    start,
    position,
    line,
    input.substr(start, position - start),
  )
}

export function next(lexer: Lexer, includeComments?: boolean): Lexer {
  // Check if not reached end of the file
  if (lexer.token.kind !== PlainTokenKind.EOF) {
    const newLexer = {
      ...lexer,
    }

    let token = lexer.token
    do {
      token = readToken(newLexer)
      newLexer.position = token.end
      newLexer.line = token.line
      newLexer.token = token
    } while (token.kind === ValuedTokenKind.COMMENT && !includeComments)
    newLexer.lastToken = lexer.token

    return newLexer
  }

  return lexer
}

export default (source: Source | string): Lexer => {
  const startOfFileToken = {
    kind: PlainTokenKind.SOF,
    start: 0,
    end: 0,
    line: 0,
  }

  return {
    source: typeof source === 'string' ? { input: source } : source,
    position: 0,
    line: 1,
    lastToken: startOfFileToken,
    token: startOfFileToken,
  }
}
