export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

export interface Location {
  readonly position: number
  readonly line: number
  readonly column: number
}

export enum ValuedTokenKind {
  NAME = 'Name',
  STRING = 'String',
  COMMENT = 'Comment',
  INT = 'Integer',
  FLOAT = 'Float',
}

export enum PlainTokenKind {
  SOF = '<SOF>',
  EOF = '<EOF>',
  BANG = '!',
  DOLLAR = '$',
  PAREN_L = '(',
  PAREN_R = ')',
  SPREAD = '...',
  COLON = ':',
  EQUALS = '=',
  AT = '@',
  BRACKET_L = '[',
  BRACKET_R = ']',
  BRACE_L = '{',
  PIPE = '|',
  BRACE_R = '}',
  SEMICOLON = ';',
}

export type TokenKindType = ValuedTokenKind | PlainTokenKind

interface BaseToken {
  start: number
  end: number
  line: number
}

export interface PlainToken extends BaseToken {
  kind: PlainTokenKind
}

export interface ValuedToken extends BaseToken {
  kind: ValuedTokenKind
  value: string
}

export type Token = PlainToken | ValuedToken

export interface Source {
  name?: string
  input: string
}

export enum String {}

export interface Lexer {
  position: number
  line: number
  lastToken: Token
  token: Token
  source: Source
}

export interface Task {
  id: string
  nodeId: string
  running: boolean
  payload?: string
  failed?: boolean
}

export interface RunReport {
  id: string
  tasks: Task[]
  map: {
    [nodeId: string]: Task
  }
}

export interface Loc {
  start: Location
  end: Location
  source: Source
}

export interface Node<Kind> {
  kind: Kind
  loc: Loc
}

export interface NameNode extends Node<'Name'> {
  value: string
}

export interface NumberValueNode extends Node<'IntValue' | 'FloatValue'> {
  value: number
}

export interface StringValueNode extends Node<'StringValue'> {
  value: string
}

export interface BooleanValueNode extends Node<'BooleanValue'> {
  value: boolean
}

export interface ReferenceNode extends Node<'Reference'> {
  value: string
}

export interface ObjectNode extends Node<'Object'> {
  properties: PropertyNode[]
}

export type ValueNode =
  | ObjectNode
  | ReferenceNode
  | NumberValueNode
  | StringValueNode
  | BooleanValueNode

export interface PropertyNode extends Node<'Property'> {
  name: NameNode
  value: ValueNode
}

export interface ActionDefinitionNode extends Node<'ActionDefinition'> {
  name: NameNode
  properties: PropertyNode[]
}

export interface WorkflowDefinitionNode extends Node<'WorkflowDefinition'> {
  name: NameNode
  properties: PropertyNode[]
}

export type DefinitionType = ActionDefinitionNode | WorkflowDefinitionNode

export interface AST {
  definitions: DefinitionType[]
  source: Source
}

export enum WorkflowNodeKind {
  Workflow,
  Action,
}

export interface DocumentNodeBase {
  id: string
  label?: string
  x: number
  y: number
  _x?: number
  _y?: number
  index: number
  resolves: string[]
}

export interface ActionNode extends DocumentNodeBase {
  resolvedById?: string
  resolvedBy?: DocumentNode
  uses: string
  action: Action
  kind: WorkflowNodeKind.Action
  props: {
    [key: string]: any
  }
}

export interface WorkflowNode extends DocumentNodeBase {
  kind: WorkflowNodeKind.Workflow
  on: string
}

export type DocumentNode = ActionNode | WorkflowNode

export interface WorkflowDocument {
  nodes: DocumentNode[]
  nodesMap: { [id: string]: DocumentNode }
}

export interface Action {
  color: string
  description: string
  icon: string
  id: string
  name: string
}
