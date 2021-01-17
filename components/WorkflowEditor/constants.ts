import { css } from "astroturf";

export interface Position {
  x: number;
  y: number;
}

export const MARGIN = 16;
export const CARD_WIDTH = 250;
export const CARD_HEIGHT = 200;
export const CARD_TRIGGER_HEIGHT = 100;
export const CARD_READ_ONLY_HEIGHT = 64;
export const HEADER_HEIGHT = 48;

// tslint:disable-next-line
css`
  :root {
    --workflow-card-width: ${CARD_WIDTH}px;
    --workflow-card-height: ${CARD_HEIGHT}px;
    --workflow-header-height: ${HEADER_HEIGHT}px;
    --workflow-margin: ${MARGIN}px;
    --workflow-card-trigger-height: ${CARD_TRIGGER_HEIGHT}px;
    --workflow-card-read-only-height: ${CARD_READ_ONLY_HEIGHT}px;
  }
`;
