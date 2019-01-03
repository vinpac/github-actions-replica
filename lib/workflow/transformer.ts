import {
  CARD_HEIGHT,
  CARD_TRIGGER_HEIGHT,
  CARD_WIDTH,
} from '~/components/WorkflowEditor/constants'
import {
  Action,
  AST,
  DefinitionType,
  DocumentNode,
  DocumentNodeBase,
  PropertyNode,
  WorkflowDocument,
  WorkflowNodeKind,
} from '.'

function objectToWorkflowString(object: object, depth: number = 0): string {
  let str = ''
  let indentation = ''

  let i = 0
  for (; i < depth; i += 1) {
    indentation += '\t'
  }

  const keys = Object.keys(object)
  keys.forEach((key, index) => {
    str += `${indentation}${key} = ${
      typeof object[key] === 'object'
        ? `{\n${objectToWorkflowString(
            object[key],
            depth + 1,
          )}\n${indentation}}`
        : JSON.stringify(object[key])
    }${index !== keys.length - 1 ? '\n' : ''}`
  })

  return str
}

export function workflowDocumentToString(doc: WorkflowDocument): string {
  let value = ''

  doc.nodes.forEach(node => {
    const props: { [key: string]: any } =
      node.kind === WorkflowNodeKind.Action
        ? {
            uses: node.uses || '',
            ...node.props,
          }
        : {
            on: node.on || '',
          }

    if (node.kind === WorkflowNodeKind.Action && node.uses) {
      props.uses = node.uses
    }

    if (node._x !== undefined) {
      props.x = node._x
    }

    if (node._y !== undefined) {
      props.y = node._y
    }

    const propsStr = objectToWorkflowString(props, 1)
    value = value.concat(
      `${node.kind === WorkflowNodeKind.Action ? 'action' : 'workflow'} ${
        node.id.includes(' ') ? `"${node.id}"` : node.id
      } {\n` +
        (node.kind === WorkflowNodeKind.Action && node.resolvedById
          ? `\tneeds = ${
              node.resolvedById.includes(' ')
                ? `"${node.resolvedById}"`
                : node.resolvedById
            }\n`
          : '') +
        (propsStr ? `${propsStr}\n` : '') +
        `}\n\n`,
    )
  })

  return value
}

function propertiesDefinitionsToObject(
  properties: PropertyNode[],
): { [key: string]: any } {
  const obj = {}

  properties.forEach(property => {
    if (property.value.kind === 'Object') {
      obj[property.name.value] = propertiesDefinitionsToObject(
        property.value.properties,
      )
      return
    }

    if (
      (property.name.value === 'x' || property.name.value === 'y') &&
      typeof property.value.value !== 'number'
    ) {
      throw new Error(
        `Invalid value for '${property.name.value}' at ${
          property.loc.start.line
        }:${property.loc.start.column}`,
      )
    }

    obj[property.name.value] = property.value.value
  })

  return obj
}

export default function transformWorkflowASTToDocument(
  ast: AST,
  actionsMap: { [id: string]: Action },
): WorkflowDocument {
  const doc: WorkflowDocument = { nodes: [], nodesMap: {} }
  const definitionByNodeId: { [id: string]: DefinitionType } = {}

  let workflowNode: DocumentNode | undefined
  ast.definitions.forEach(definition => {
    const allProps: { [key: string]: any } & {
      x?: number
      y?: number
    } = propertiesDefinitionsToObject(definition.properties)

    const { label, x, y, needs, uses, ...props } = allProps

    let node: DocumentNode | undefined
    const base: DocumentNodeBase = {
      id: definition.name.value,
      label: label ? String(label) : undefined,
      index: 0,
      x: x || 0,
      y: y || 0,
      _x: x,
      _y: y,
      resolves: [],
    }

    if (definition.kind === 'ActionDefinition') {
      if (!actionsMap[uses]) {
        throw new Error(`${uses} is not a valid action`)
      }

      node = {
        ...base,
        kind: WorkflowNodeKind.Action,
        uses,
        action: actionsMap[uses],
        props,
        resolvedById: needs,
      }
    } else {
      node = {
        ...base,
        kind: WorkflowNodeKind.Workflow,
        on: props.on,
      }

      workflowNode = node
    }

    definitionByNodeId[node.id] = definition

    doc.nodes.push(node)
    doc.nodesMap[node.id] = node
  })

  // TODO: IMPROVE
  doc.nodes.forEach(node => {
    if (node.kind === WorkflowNodeKind.Workflow) {
      return
    }

    const { resolvedById } = node
    if (resolvedById) {
      const parentNode = doc.nodesMap[resolvedById]
      if (!parentNode) {
        throw new Error(`Action or Workflow '${resolvedById}' is not defined`)
      }

      parentNode.resolves.push(node.id)
      node.resolvedBy = parentNode
    }
  })

  if (workflowNode) {
    const updatePosition = (
      nodeId: string,
      index: number,
      parentNode: DocumentNode,
    ) => {
      const node = doc.nodesMap[nodeId]

      if (node._x === undefined) {
        node.x = parentNode.x + index * (CARD_WIDTH + 50)
      }

      if (node._y === undefined) {
        node.y =
          parentNode.y +
          (parentNode.kind === WorkflowNodeKind.Workflow
            ? CARD_TRIGGER_HEIGHT
            : CARD_HEIGHT) +
          50
      }

      node.index = parentNode.index + 1
      node.resolves.forEach((id, childIndex) =>
        updatePosition(id, childIndex, node),
      )
    }

    workflowNode.resolves.forEach((id, index) =>
      updatePosition(id, index, workflowNode!),
    )
  }

  return doc
}
