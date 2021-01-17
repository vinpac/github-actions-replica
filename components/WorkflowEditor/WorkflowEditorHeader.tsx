import { css } from "astroturf";
import * as React from "react";
import Icon from "../Icon";
import { WorkflowEditorPanel, WorkflowEditorState } from "./WorkflowEditor";

const s = css`
  .container {
    height: var(--workflow-header-height);
    background: #24292e;
    position: relative;
    z-index: 1000;
  }

  .tabs {
    height: 48px;
    padding-top: 8px;
    padding-left: 16px;
  }

  .brand {
    margin-right: 20px;
    padding-top: 5px;
    float: left;

    path {
      fill: rgba(255, 255, 255, 0.7);
    }

    &:hover {
      path {
        fill: #fff;
      }
    }
  }

  .tab {
    border: 0;
    outline: none !important;
    border-radius: 3px 3px 0 0;
    background: #3f4950;
    color: #fff;
    height: 40px;
    padding: 0px 16px;
    font-size: 14px;
  }

  .toolbar {
    background: #3f4950;
    height: 46px;
    padding-top: 4px;
    padding-bottom: 4px;
  }

  .pill {
    font-size: 14px;
    background: #475058;
    color: #fff;
    border: 0;
    border-radius: 8px 8px 0 0;
    padding: 11px 16px;
    margin: 2px 0 0;

    cursor: pointer;
    font-weight: 500;

    &.active {
      background: #fff;
      color: #242a2f;
    }
  }

  .tabPreview.active {
    background: #ececf2 !important;
  }

  .run {
    width: 100px;
    height: 100px;
    position: absolute;
    right: 250px;
    top: 70px;
    border: 6px solid #ececf4 !important;
    border-radius: 50%;
    z-index: 1000;
    font-size: 48px;
  }
`;

interface WorkflowEditorHeaderProps {
  readonly className?: string;
  readonly state: WorkflowEditorState;
  readonly dispatch: (action: any) => any;
}

const WorkflowEditorHeader: React.SFC<WorkflowEditorHeaderProps> = ({
  state,
  dispatch,
}) => (
  <div className={s.container}>
    <div className={s.tabs}>
      <a className={s.brand} href="/">
        <svg height="24" viewBox="0 0 16 16" version="1.1" width="24">
          <path
            fillRule="evenodd"
            d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"
          />
        </svg>
      </a>
      <button
        className={`${s.pill} ${s.tabPreview} btn${
          state.panel === WorkflowEditorPanel.Preview ? ` ${s.active}` : ""
        }`}
        onClick={() => {
          dispatch({
            type: "SET_PANEL",
            payload: WorkflowEditorPanel.Preview,
          });
        }}
      >
        PREVIEW
      </button>
      <button
        className={`${s.pill} btn${
          state.panel === WorkflowEditorPanel.Code ? ` ${s.active}` : ""
        }`}
        onClick={() =>
          dispatch({
            type: "SET_PANEL",
            payload: WorkflowEditorPanel.Code,
          })
        }
      >
        CODE
      </button>
    </div>
  </div>
);

WorkflowEditorHeader.displayName = "WorkflowEditorHeader";

export default React.memo(WorkflowEditorHeader);
