import { DocumentNode, WorkflowNodeKind } from '~/lib/workflow'
import {
  CARD_HEIGHT,
  CARD_READ_ONLY_HEIGHT,
  CARD_TRIGGER_HEIGHT,
} from './constants'

export function calculateNodeY(node: DocumentNode, readOnly?: boolean): number {
  return readOnly && node.kind !== WorkflowNodeKind.Workflow
    ? node.y -
        (node.resolvedBy && node.resolvedBy.kind === WorkflowNodeKind.Workflow
          ? CARD_TRIGGER_HEIGHT - CARD_READ_ONLY_HEIGHT
          : CARD_HEIGHT - CARD_READ_ONLY_HEIGHT) *
          (node.index - 1 || 1)
    : node.y
}
