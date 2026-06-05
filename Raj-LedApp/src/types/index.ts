export type ID = string;

export interface Guide { orientation: 'h'|'v'; positionPx: number; locked?: boolean; }

export interface CanvasSettings {
  widthPx: number;
  heightPx: number;
  gridSize: number;
  showGrid: boolean;
  background?: { src: string; fit: 'contain'|'cover'|'stretch'; opacity: number; locked: boolean };
  logo?: { x: number; y: number; size: number; locked: boolean };
  guides: Guide[];
  zoom: number;
  pan: { x: number; y: number };
}

export interface ModuleType {
  id: ID; name: string;
  widthPx: number; heightPx: number;
}

export interface ModuleInstance {
  id: ID; typeId: ID;
  x: number; y: number;
  rotation: number;
  flipX?: boolean; flipY?: boolean;
  label?: string;
  z: number;
  locked?: boolean;
  fill?: string;
}

export interface Group {
  id: ID; name: string; memberIds: ID[];
}

export interface Project {
  id: ID; name: string;
  canvas: CanvasSettings;
  moduleTypes: ModuleType[];
  modules: ModuleInstance[];
  groups: Group[];
  meta: { createdAt: string; modifiedAt: string; version: number; };
}

export interface SelectionState {
  ids: ID[];
  lastSelectedId?: ID;
}
