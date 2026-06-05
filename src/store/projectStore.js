import { create } from 'zustand';
import { nanoid } from '@/utils/nanoid';

const nowISO = () => new Date().toISOString();
const deepClone = (v) => {
  if (typeof structuredClone === 'function') return structuredClone(v);
  return JSON.parse(JSON.stringify(v));
};
const MAX_HISTORY = 100;

const PANELS_LIBRARY = [
  { brand: 'ROE', model: 'BP2', widthPx: 176, heightPx: 176 },
  { brand: 'ROE', model: 'BP3 / 3.9', widthPx: 128, heightPx: 128 },
  { brand: 'ROE', model: 'CB5', widthPx: 104, heightPx: 208 },
  { brand: 'ROE', model: 'CB5 90°', widthPx: 208, heightPx: 104 },
  { brand: 'Unilumin', model: 'Upad III 2.6', widthPx: 192, heightPx: 192 },
  { brand: 'Unilumin', model: 'Upad III 2.9', widthPx: 168, heightPx: 168 },
  { brand: 'Unilumin', model: 'Upad III 3.9', widthPx: 128, heightPx: 128 },
  { brand: 'Absen', model: 'A3 Pro 3.9', widthPx: 128, heightPx: 128 },
  { brand: 'Absen', model: 'PL2.5 Pro', widthPx: 200, heightPx: 200 },
  { brand: 'INFiLED', model: 'ER 3.9 (500)', widthPx: 128, heightPx: 128 },
  { brand: 'INFiLED', model: 'ER 3.9 (1000)', widthPx: 128, heightPx: 256 },
  { brand: 'Gloshine', model: 'MX 2.9', widthPx: 168, heightPx: 168 },
  { brand: 'Gloshine', model: 'MX 3.9', widthPx: 128, heightPx: 128 },
  { brand: 'Dicolor', model: 'Matrix 2.6', widthPx: 192, heightPx: 192 },
];

const seedTypes = [
  { id: nanoid(), name: '500×500', widthPx: 500, heightPx: 500 },
  { id: nanoid(), name: '1000×500', widthPx: 1000, heightPx: 500 },
  { id: nanoid(), name: '480×480', widthPx: 480, heightPx: 480 },
  { id: nanoid(), name: '960×960', widthPx: 960, heightPx: 960 },
  { id: nanoid(), name: '640×640', widthPx: 640, heightPx: 640 },
  { id: nanoid(), name: '256×256', widthPx: 256, heightPx: 256 },
];

const initialProject = {
  id: nanoid(),
  name: 'Untitled Project',
  canvas: {
    widthPx: 3840,
    heightPx: 2160,
    gridSize: 50,
    showGrid: true,
    gridColor: '#333333',
    canvasBg: '#000000',
    viewportBg: '#1a1a2e',
    zoom: 1,
    snapEnabled: false,
    labelFontSize: 12,
    labelBg: 'rgba(0,0,0,0.7)',
    labelTextColor: '#ffffff',
    greyMode: false,
  },
  moduleTypes: seedTypes,
  modules: [],
  groups: [],
  meta: { createdAt: nowISO(), modifiedAt: nowISO(), version: 1 },
};

export { PANELS_LIBRARY };

export const useProject = create((set, get) => ({
  project: initialProject,
  selection: { ids: [] },
  activeType: null,
  stageRef: { current: null },

  _undoStack: [],
  _redoStack: [],

  pushHistory: () => {
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
    set({
      project: prev,
      _undoStack: _undoStack.slice(0, -1),
      _redoStack: [..._redoStack, deepClone(project)],
      selection: { ids: [] },
    });
  },
  redo: () => {
    const { _undoStack, _redoStack, project } = get();
    if (_redoStack.length === 0) return;
    const next = _redoStack[_redoStack.length - 1];
    set({
      project: next,
      _undoStack: [..._undoStack, deepClone(project)],
      _redoStack: _redoStack.slice(0, -1),
      selection: { ids: [] },
    });
  },

  setProjectCanvasZoom: (zoom) =>
    set((s) => ({
      project: {
        ...s.project,
        canvas: { ...s.project.canvas, zoom: Math.max(0.05, Math.min(8, zoom)) },
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

  toggleSnapEnabled: () => {
    const on = !get().project.canvas.snapEnabled;
    set((s) => ({
      project: {
        ...s.project,
        canvas: { ...s.project.canvas, snapEnabled: on },
        meta: { ...s.project.meta, modifiedAt: nowISO() },
      },
    }));
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
        name: name.trim() || 'Untitled Project',
        meta: { ...s.project.meta, modifiedAt: nowISO() },
      },
    })),

  setBackgroundImage: (src) =>
    set((s) => ({
      project: {
        ...s.project,
        canvas: { ...s.project.canvas, background: { ...(s.project.canvas.background || {}), src, fit: 'contain' } },
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
          logo: { ...(s.project.canvas.logo || { x: 0, y: 0, size: 200 }), ...updates },
        },
        meta: { ...s.project.meta, modifiedAt: nowISO() },
      },
    })),

  setActiveType: (typeId) => set({ activeType: typeId }),

  addModuleType: (name, widthPx, heightPx) => {
    const id = nanoid();
    set((s) => ({
      project: {
        ...s.project,
        moduleTypes: [...s.project.moduleTypes, { id, name, widthPx, heightPx }],
        meta: { ...s.project.meta, modifiedAt: nowISO() },
      },
    }));
    return id;
  },

  addModule: (typeId, x, y, rotation = 0, fill, label) =>
    set((s) => ({
      project: {
        ...s.project,
        modules: [...s.project.modules, { id: nanoid(), typeId, x, y, rotation: rotation || 0, fill, label }],
        meta: { ...s.project.meta, modifiedAt: nowISO() },
      },
    })),

  removeModules: (ids) => {
    get().pushHistory();
    set((s) => ({
      project: {
        ...s.project,
        modules: s.project.modules.filter((m) => !ids.includes(m.id)),
        groups: s.project.groups
          .map((g) => ({ ...g, memberIds: g.memberIds.filter((id) => !ids.includes(id)) }))
          .filter((g) => g.memberIds.length > 0),
        meta: { ...s.project.meta, modifiedAt: nowISO() },
      },
      selection: { ids: [] },
    }));
  },

  setModulesXY: (updates) =>
    set((s) => ({
      project: {
        ...s.project,
        modules: s.project.modules.map((m) =>
          updates[m.id] ? { ...m, x: updates[m.id].x, y: updates[m.id].y } : m
        ),
        meta: { ...s.project.meta, modifiedAt: nowISO() },
      },
    })),

  moveModulesBy: (ids, dx, dy) => {
    const { project } = get();
    const updates = {};
    for (const id of ids) {
      const m = project.modules.find((mm) => mm.id === id);
      if (m) updates[id] = { x: m.x + dx, y: m.y + dy };
    }
    get().setModulesXY(updates);
  },

  setSelection: (ids) => {
    const next = typeof ids === 'function' ? ids(get().selection.ids) : ids;
    set({ selection: { ids: next } });
  },

  createGroupFromSelection: (name, color) => {
    const { selection } = get();
    if (selection.ids.length < 2) return;
    get().pushHistory();
    const id = nanoid();
    const grpColor = color || '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
    set((s) => ({
      project: {
        ...s.project,
        groups: [
          ...s.project.groups,
          {
            id,
            name: name || `Group ${s.project.groups.length + 1}`,
            memberIds: [...s.selection.ids],
            color: grpColor,
            borderWidth: 2,
            borderStyle: 'solid',
            fontSize: 14,
            labelBg: 'rgba(0,0,0,0.6)',
            labelTextColor: '#ffffff',
            gradient: { mode: '1', color: grpColor },
          },
        ],
        meta: { ...s.project.meta, modifiedAt: nowISO() },
      },
    }));
  },

  ungroupGroup: (groupId) => {
    get().pushHistory();
    set((s) => ({
      project: {
        ...s.project,
        groups: s.project.groups.filter((g) => g.id !== groupId),
        meta: { ...s.project.meta, modifiedAt: nowISO() },
      },
    }));
  },

  updateGroup: (groupId, updates) =>
    set((s) => ({
      project: {
        ...s.project,
        groups: s.project.groups.map((g) => (g.id === groupId ? { ...g, ...updates } : g)),
        meta: { ...s.project.meta, modifiedAt: nowISO() },
      },
    })),

  importJSON: (jsonString) => {
    const parsed = JSON.parse(jsonString);
    get().pushHistory();
    set({ project: parsed, selection: { ids: [] } });
  },

  exportJSON: () => JSON.stringify(get().project, null, 2),

  getPANELS_LIBRARY: () => PANELS_LIBRARY,
}));