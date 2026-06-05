import { create } from "zustand";
import { nanoid } from "nanoid";


export type ID = string;

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export interface CanvasSettings {
  widthPx: number
  heightPx: number
  gridSize: number
  showGrid: boolean
  gridColor: string
  canvasBg: string
  viewportBg: string
  zoom: number
  snapEnabled: boolean
  


  // background image
  background?: { src: string; fit: "contain" | "cover" | "stretch" }

  // logo watermark
  logo?: { x: number; y: number; size: number; src?: string }

 // 🔹 view-only flags (don’t touch real colours)
  greyMode?: boolean

  // extras used elsewhere in the app (present in your initial state)
  labelFontSize?: number
  labelBg?: string
  labelTextColor?: string
  assetUrl?: string
}

export interface ModuleType {
  id: ID;
  name: string;
  widthPx: number;
  heightPx: number;
}

export interface ModuleInstance {
  id: ID;
  typeId: ID;
  x: number;
  y: number;
  rotation: number;
  label?: string;
  fill?: string;
}

export interface Group {
  id: ID;
  name: string;
  memberIds: ID[];
  color: string;
  borderWidth?: number;
  borderStyle?: "solid" | "dashed" | "dotted";
  fontSize?: number;
  labelBg?: string;
  labelTextColor?: string;

  // gradient support (used by GroupsPanel/StageViewport)
  gradient?: {
    mode: "1" | "2" | "4";
    color?: string;
    colors?: string[];
    direction?: "horizontal" | "vertical" | "diag";
  };
}

export interface Project {
  id: ID;
  name: string;
  canvas: CanvasSettings;
  moduleTypes: ModuleType[];
  modules: ModuleInstance[];
  groups: Group[];
  meta: { createdAt: string; modifiedAt: string; version: number };
}

export interface SelectionState {
  ids: ID[];
}

/* ------------------------------------------------------------------ */
/* Store interface                                                    */
/* ------------------------------------------------------------------ */

interface ProjectStore {
  project: Project;
  selection: SelectionState;
  activeType: ID | null;

  // History
  _undoStack: Project[];
  _redoStack: Project[];
  pushHistory: (label?: string) => void;
  undo: () => void;
  redo: () => void;

  // Canvas / UI
  setProjectCanvasZoom: (zoom: number) => void;
  setProjectCanvasShowGrid: (show: boolean) => void;
  setSnapEnabled: (on: boolean) => void;
  toggleSnapEnabled: () => void;
  updateCanvas: (updates: Partial<CanvasSettings>) => void;
  setProjectName: (name: string) => void;

  // Background / logo helpers
  setBackgroundImage: (src: string) => void;
  clearBackgroundImage: () => void;
  setLogoBox: (updates: Partial<{ x: number; y: number; size: number; src?: string }>) => void;

  // Modules
  setActiveType: (typeId: ID | null) => void;
  addModule: (
    typeId: ID,
    x: number,
    y: number,
    rotation?: number,
    fill?: string,
    label?: string
  ) => void;
  removeModules: (ids: ID[]) => void;
  setModulesXY: (updates: Record<ID, { x: number; y: number }>) => void;
  moveModulesBy: (ids: ID[], dx: number, dy: number) => void;
  setSelection: (ids: ID[] | ((prev: ID[]) => ID[])) => void;

  // Groups
  createGroupFromSelection: (name?: string, color?: string) => void;
  ungroupGroup: (groupId: ID) => void;
  updateGroup: (groupId: ID, updates: Partial<Group>) => void;

  // Types
  addModuleType: (name: string, widthPx: number, heightPx: number) => ID;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

const nowISO = () => new Date().toISOString();

const seedTypes: ModuleType[] = [
  { id: nanoid(), name: "500×500", widthPx: 500, heightPx: 500 },
  { id: nanoid(), name: "1000×500", widthPx: 1000, heightPx: 500 },
  { id: nanoid(), name: "480×480", widthPx: 480, heightPx: 480 },
  { id: nanoid(), name: "960×960", widthPx: 960, heightPx: 960 },
  { id: nanoid(), name: "640×640", widthPx: 640, heightPx: 640 },
  { id: nanoid(), name: "256×256", widthPx: 256, heightPx: 256 },
];

// random hex for default one-colour groups
const randHex = () =>
  "#" + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0");

// safer deep clone
const deepClone = <T,>(v: T): T => {
  // @ts-ignore
  if (typeof structuredClone === "function") return structuredClone(v);
  return JSON.parse(JSON.stringify(v));
};

const MAX_HISTORY = 100;

/* ------------------------------------------------------------------ */
/* Initial project                                                    */
/* ------------------------------------------------------------------ */

const initialProject: Project = {
  id: nanoid(),
  name: "Untitled Project",
  canvas: {
    widthPx: 3840,
    heightPx: 2160,
    gridSize: 50,
    showGrid: true,
    gridColor: "#ff0000",
    canvasBg: "#000000",
    viewportBg: "#1f1f1f",
    zoom: 1,
    snapEnabled: false,
    labelFontSize: 12,
    labelBg: "rgba(0,0,0,0.7)",
    labelTextColor: "#ffffff",
    assetUrl: "/assets/default-logo.png",
    greyMode: false,       // 🔹 NEW
  },
  moduleTypes: seedTypes,
  modules: [],
  groups: [],
  meta: { createdAt: nowISO(), modifiedAt: nowISO(), version: 1 },
};

/* ------------------------------------------------------------------ */
/* Store                                                              */
/* ------------------------------------------------------------------ */

export const useProject = create<ProjectStore>((set, get) => ({
  project: initialProject,
  selection: { ids: [] },
  activeType: null,

  // ------------------ History ------------------
  _undoStack: [],
  _redoStack: [],
  pushHistory: (_label) => {
    const { project, _undoStack } = get();
    const snap = deepClone(project);
    const next = [..._undoStack, snap];
    if (next.length > MAX_HISTORY) next.shift();
    set({ _undoStack: next, _redoStack: [] });
  },
  undo: () => {
    const { _undoStack, _redoStack, project } = get();
    if (_undoStack.length === 0) return;
    const prev = _undoStack[_undoStack.length - 1];
    const newUndo = _undoStack.slice(0, -1);
    const redoSnap = deepClone(project);
    set({
      project: prev,
      _undoStack: newUndo,
      _redoStack: [..._redoStack, redoSnap],
      selection: { ids: [] },
    });
  },
  redo: () => {
    const { _undoStack, _redoStack, project } = get();
    if (_redoStack.length === 0) return;
    const next = _redoStack[_redoStack.length - 1];
    const newRedo = _redoStack.slice(0, -1);
    const undoSnap = deepClone(project);
    set({
      project: next,
      _undoStack: [..._undoStack, undoSnap],
      _redoStack: newRedo,
      selection: { ids: [] },
    });
  },

  // ------------------ Canvas / UI ------------------
  setProjectCanvasZoom: (zoom) =>
    set((s) => ({
      project: {
        ...s.project,
        canvas: {
          ...s.project.canvas,
          zoom: Math.max(0.1, Math.min(8, zoom)),
        },
        meta: { ...s.project.meta, modifiedAt: nowISO() },
      },
    })),

  setProjectCanvasShowGrid: (show) =>
    set((s) => ({
      project: {
        ...s.project,
        canvas: { ...s.project.canvas, showGrid: show },
        meta: { ...s.project.meta, modifiedAt: nowISO() },
      },
    })),

  setSnapEnabled: (on) =>
    set((s) => ({
      project: {
        ...s.project,
        canvas: { ...s.project.canvas, snapEnabled: on },
        meta: { ...s.project.meta, modifiedAt: nowISO() },
      },
    })),
  toggleSnapEnabled: () => {
    const on = !get().project.canvas.snapEnabled;
    get().setSnapEnabled(on);
  },

  updateCanvas: (updates) =>
    set((s) => ({
      project: {
        ...s.project,
        canvas: { ...s.project.canvas, ...updates },
        meta: { ...s.project.meta, modifiedAt: nowISO() },
      },
    })),

  setProjectName: (name) =>
    set((s) => ({
      project: {
        ...s.project,
        name: name.trim() || "Untitled Project",
        meta: { ...s.project.meta, modifiedAt: nowISO() },
      },
    })),

  // Background / logo
  setBackgroundImage: (src: string) =>
    set((s) => ({
      project: {
        ...s.project,
        canvas: {
          ...s.project.canvas,
          background: { ...(s.project.canvas.background || {}), src }
        },
        meta: { ...s.project.meta, modifiedAt: nowISO() },
      },
    })),

  clearBackgroundImage: () =>
    set((s) => ({
      project: {
        ...s.project,
        canvas: { ...s.project.canvas, background: undefined },
        meta: { ...s.project.meta, modifiedAt: nowISO() },
      },
    })),

  setLogoBox: (updates) =>
    set((s) => ({
      project: {
        ...s.project,
        canvas: {
          ...s.project.canvas,
          logo: { ...(s.project.canvas.logo || { x: 0, y: 0, size: 200 }), ...updates }
        },
        meta: { ...s.project.meta, modifiedAt: nowISO() },
      },
    })),

  // ------------------ Modules ------------------
  setActiveType: (typeId) => set({ activeType: typeId }),

  // NOTE: we DO NOT pushHistory here (placement calls addModule many times).
  // Call pushHistory() once *before* bulk placement from StageViewport.
  addModule: (typeId, x, y, rotation = 0, fill, label) =>
    set((s) => ({
      project: {
        ...s.project,
        modules: [
          ...s.project.modules,
          { id: nanoid(), typeId, x, y, rotation, fill, label },
        ],
        meta: { ...s.project.meta, modifiedAt: nowISO() },
      },
    })),

  removeModules: (ids) => {
    get().pushHistory("remove");
    set((s) => {
      const newGroups = s.project.groups
        .map((g) => ({
          ...g,
          memberIds: g.memberIds.filter((id) => !ids.includes(id)),
        }))
        .filter((g) => g.memberIds.length > 0);
      return {
        project: {
          ...s.project,
          modules: s.project.modules.filter((m) => !ids.includes(m.id)),
          groups: newGroups,
          meta: { ...s.project.meta, modifiedAt: nowISO() },
        },
        selection: { ids: [] },
      };
    });
  },

  // Called continuously during drags — DO NOT snapshot here.
  setModulesXY: (updates) =>
    set((s) => ({
      project: {
        ...s.project,
        modules: s.project.modules.map((m) =>
          updates[m.id]
            ? { ...m, x: updates[m.id].x, y: updates[m.id].y }
            : m
        ),
        meta: { ...s.project.meta, modifiedAt: nowISO() },
      },
    })),

  // Arrow keys nudge — snapshot per keypress feels right.
  moveModulesBy: (ids, dx, dy) => {
    get().pushHistory("nudge");
    set((s) => ({
      project: {
        ...s.project,
        modules: s.project.modules.map((m) =>
          ids.includes(m.id) ? { ...m, x: m.x + dx, y: m.y + dy } : m
        ),
        meta: { ...s.project.meta, modifiedAt: nowISO() },
      },
    }));
  },

  setSelection: (idsOrFn) =>
    set((s) => ({
      selection: {
        ids: Array.isArray(idsOrFn)
          ? idsOrFn
          : idsOrFn(s.selection.ids),
      },
    })),

  // ------------------ Groups ------------------
  createGroupFromSelection: (name, color) => {
    const ids = get().selection.ids;
    if (ids.length < 2) return;

    get().pushHistory("group");

    set((s) => {
      const group: Group = {
        id: nanoid(),
        name: name || `Group ${s.project.groups.length + 1}`,
        memberIds: [...ids],
        color: color || "#3fa7ff",
        borderWidth: 2,
        fontSize: 16,
        labelBg: "rgba(0,0,0,0.7)",
        labelTextColor: "#ffffff",

        // default ONE-COLOUR gradient for new groups
        gradient: { mode: "1", color: randHex() },
      };
      return {
        project: {
          ...s.project,
          groups: [...s.project.groups, group],
          meta: { ...s.project.meta, modifiedAt: nowISO() },
        },
      };
    });
  },

  ungroupGroup: (groupId) => {
    get().pushHistory("ungroup");
    set((s) => ({
      project: {
        ...s.project,
        groups: s.project.groups.filter((g) => g.id !== groupId),
        meta: { ...s.project.meta, modifiedAt: nowISO() },
      },
    }));
  },

  // For frequent UI tweaks (typing name, picking a colour), you may want to call
  // pushHistory from the UI right before committing, to avoid history spam.
  updateGroup: (groupId, updates) =>
    set((s) => ({
      project: {
        ...s.project,
        groups: s.project.groups.map((g) =>
          g.id === groupId ? { ...g, ...updates } : g
        ),
        meta: { ...s.project.meta, modifiedAt: nowISO() },
      },
    })),

  // ------------------ Types ------------------
  addModuleType: (name, widthPx, heightPx) => {
    const id = nanoid();
    set((s) => ({
      project: {
        ...s.project,
        moduleTypes: [
          ...s.project.moduleTypes,
          { id, name, widthPx, heightPx },
        ],
        meta: { ...s.project.meta, modifiedAt: nowISO() },
      },
    }));
    return id;
  },
}));


