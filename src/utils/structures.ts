export class Vertex {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

export type SnapMode = "NONE" | "SNAP_ALL" | "SNAP_START" | "SNAP_TARGET";
export type AutoCommand = {
  type: "command";
  name: string;
  id: string;
  parameters: { [key: string]: string };
};
export type AutoGroup = {
  type: "group";
  name: string;
  id: string;
  children: AutoStep[];
};
export type AutoStep = AutoCommand | AutoGroup;
export type Auto = AutoStep[];

type EditorState = {
  tab: "editor";
  filename?: string;
  unsaved: boolean;
};

type PathState = {
  tab: "path";
  filename?: never;
  unsaved?: never;
};

export type WindowState = EditorState | PathState;

export type Template = GroupTemplate | CommandTemplate;

export type GroupTemplate = {
  type: "group";
  id: string;
};

export type CommandTemplate = {
  type: "command";
  id: string;
  parameters: { [key: string]: string };
};
