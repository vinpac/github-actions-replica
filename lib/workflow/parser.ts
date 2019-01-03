// @ts-nocheck
import {
  AST,
  DefinitionType,
  Lexer,
  NameNode,
  Node,
  ObjectNode,
  Omit,
  PlainTokenKind,
  PropertyNode,
  Source,
  TokenKindType,
  ValuedToken,
  ValuedTokenKind,
  ValueNode,
} from '.'
import { WorkflowUnexpectedError } from './errors/WorkflowUnexpectedError'
import createLexer, { next } from './lexer'
import { createLocation } from './utils'

function createNode<K extends Node<K['kind']>>(
  kind: K['kind'],
  start: number,
  end: number,
  source: Source,
): Node<K['kind']>
function createNode<K extends Node<K['kind']>, O = Omit<K, 'kind' | 'loc'>>(
  kind: K['kind'],
  start: number,
  end: number,
  source: Source,
  overrides: O,
): Node<K['kind']> & O
function createNode<K extends Node<K['kind']>, O = Omit<K, 'kind' | 'loc'>>(
  kind: K['kind'],
  start: number,
  end: number,
  source: Source,
  overrides?: O,
): Node<K['kind']> {
  return {
    ...overrides,
    kind,
    loc: {
      start: createLocation(source, start),
      end: createLocation(source, end),
      source,
    },
  }
}

function assertTokenKind(lexer: Lexer, expectedKind: TokenKindType) {
  if (lexer.token.kind !== expectedKind) {
    throw new WorkflowUnexpectedError(lexer.source, lexer.token, expectedKind)
  }
}

function assertTokenKindAndLine(
  lexer: Lexer,
  expectedKind: TokenKindType,
  line: number,
) {
  if (lexer.token.kind !== expectedKind || line !== lexer.line) {
    throw new WorkflowUnexpectedError(lexer.source, lexer.token, expectedKind)
  }
}

function assertTokenKindIn(
  lexer: Lexer,
  expectedKinds: TokenKindType[],
): TokenKindType {
  const index = expectedKinds.indexOf(lexer.token.kind)
  if (index === -1) {
    throw new WorkflowUnexpectedError(
      lexer.source,
      lexer.token,
      expectedKinds.join(', '),
    )
  }

  return expectedKinds[index]
}

const validValueTokenKinds = [
  ValuedTokenKind.STRING,
  ValuedTokenKind.FLOAT,
  ValuedTokenKind.INT,
  ValuedTokenKind.NAME,
]
function parseValue(lexer: Lexer): [ValueNode, Lexer] {
  if (lexer.token.kind === PlainTokenKind.BRACE_L) {
    return parseObjectValue(lexer)
  }

  const token = lexer.token as ValuedToken
  const tokenKind = assertTokenKindIn(lexer, validValueTokenKinds)

  if (token.value !== undefined) {
    let nodeKind: ValueNode['kind'] | undefined
    let value: string | boolean | number | undefined
    if (tokenKind === ValuedTokenKind.NAME) {
      if (token.value === 'false' || token.value === 'true') {
        nodeKind = 'BooleanValue'
        value = token.value === 'true'
      } else {
        nodeKind = 'Reference'
        value = token.value
      }
    }

    if (tokenKind === ValuedTokenKind.STRING) {
      nodeKind = 'StringValue'
      value = token.value
    }

    if (tokenKind === ValuedTokenKind.FLOAT) {
      nodeKind = 'FloatValue'
      value = parseFloat(token.value)
    }

    if (tokenKind === ValuedTokenKind.INT) {
      nodeKind = 'IntValue'
      value = parseInt(token.value, 10)
    }

    if (value !== undefined && nodeKind) {
      return [
        // @ts-ignore
        createNode<ValueNode>(nodeKind, token.start, token.end, lexer.source, {
          value: value as any,
        }),
        next(lexer),
      ]
    }
  }

  throw new WorkflowUnexpectedError(lexer.source, lexer.token)
}

function parseProperty(lexer: Lexer): [PropertyNode, Lexer] {
  let newLexer = lexer
  const { line } = lexer
  const start = lexer.token.start

  assertTokenKindAndLine(newLexer, ValuedTokenKind.NAME, line)
  const name = createNode<NameNode>(
    'Name',
    newLexer.token.start,
    newLexer.token.end,
    newLexer.source,
    { value: (newLexer.token as ValuedToken).value },
  )
  newLexer = next(newLexer)
  assertTokenKindAndLine(newLexer, PlainTokenKind.EQUALS, line)
  newLexer = next(newLexer)

  if (newLexer.line !== line) {
    throw new WorkflowUnexpectedError(newLexer.source, newLexer.token)
  }

  const valueParsingResp = parseValue(newLexer)

  return [
    createNode<PropertyNode>(
      'Property',
      start,
      newLexer.token.end,
      newLexer.source,
      {
        name,
        value: valueParsingResp[0],
      },
    ),
    valueParsingResp[1],
  ]
}

function parseObjectValue(lexer: Lexer): [ObjectNode, Lexer] {
  const properties: PropertyNode[] = []
  let newLexer = lexer
  assertTokenKind(newLexer, PlainTokenKind.BRACE_L)
  newLexer = next(newLexer)

  while (newLexer.token.kind !== PlainTokenKind.BRACE_R) {
    if (newLexer.token.kind === ValuedTokenKind.NAME) {
      const resp = parseProperty(newLexer)
      const property = resp[0]

      properties.push(resp[0])
      newLexer = resp[1]

      if (newLexer.token.line === property.loc.end.line) {
        throw new WorkflowUnexpectedError(lexer.source, newLexer.token)
      }

      continue
    }

    throw new WorkflowUnexpectedError(newLexer.source, newLexer.token)
  }

  return [
    createNode<ObjectNode>(
      'Object',
      lexer.token.start,
      newLexer.token.end,
      newLexer.source,
      { properties },
    ),
    next(newLexer),
  ]
}

function parseDefinition(
  kind: DefinitionType['kind'],
  lexer: Lexer,
): [DefinitionType, Lexer] {
  const start = lexer.token.start
  let newLexer = next(lexer)

  assertTokenKindIn(newLexer, [ValuedTokenKind.NAME, ValuedTokenKind.STRING])
  if (
    newLexer.token.line !== lexer.line ||
    lexer.token.end === newLexer.token.start
  ) {
    throw new WorkflowUnexpectedError(lexer.source, newLexer.token)
  }

  const name: NameNode = createNode<NameNode>(
    'Name',
    newLexer.token.start,
    newLexer.token.end,
    newLexer.source,
    { value: (newLexer.token as ValuedToken).value },
  )

  const parseObjectResp = parseObjectValue(next(newLexer))
  newLexer = parseObjectResp[1]

  return [
    createNode<DefinitionType>(
      kind,
      start,
      newLexer.token.end,
      newLexer.source,
      {
        name,
        properties: parseObjectResp[0].properties,
      },
    ) as DefinitionType,
    newLexer,
  ]
}

export function parseWorkflow(input: string): AST {
  const definitions: DefinitionType[] = []
  // Skip <SOF>
  let lexer = next(createLexer(input))

  while (lexer.token.kind !== PlainTokenKind.EOF) {
    const { token } = lexer

    switch (token.kind) {
      case ValuedTokenKind.NAME:
        if (token.value === 'action') {
          const resp = parseDefinition('ActionDefinition', lexer)
          lexer = resp[1]
          definitions.push(resp[0])
          break
        }

        if (token.value === 'workflow') {
          const resp = parseDefinition('WorkflowDefinition', lexer)
          lexer = resp[1]
          definitions.push(resp[0])
          break
        }
      default:
        throw new WorkflowUnexpectedError(lexer.source, token)
    }
  }

  return {
    definitions,
    source: lexer.source,
  }
}
