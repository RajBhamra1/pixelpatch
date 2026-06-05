import { useRef, useState, useEffect, useCallback } from 'react';
import { Stage, Layer, Rect, Text, Line } from 'react-konva';
import { useProject } from '@/store/projectStore';
import ModuleRect from './ModuleRect';
import GroupOverlay from './GroupOverlay';

const SNAP_THRESHOLD = 16;

function snapVal(v, grid) {
  return Math.round(v / Math.max(grid, 1)) * Math.max(grid, 1);
}

export default function StageViewport({ onMousePos }) {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const isPanning = useRef(false);
  const lastPan = useRef({ x: 0, y: 0 });
  const spaceDown = useRef(false);
  const dragStart = useRef(null);

  const {
    project,
    selection,
    setSelection,
    setModulesXY,
    pushHistory,
    addModule,
    removeModules,
    stageRef: storeStageRef,
  } = useProject();

  const { canvas } = project;
  const zoom = canvas.zoom ?? 1;

  // Expose stage ref to store
  useEffect(() => {
    if (stageRef.current) storeStageRef.current = stageRef.current;
  }, [stageRef.current]);

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // Keyboard: delete, arrows, undo/redo
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && selection.ids.length > 0) {
        removeModules(selection.ids);
      }
      if (e.key === ' ') { e.preventDefault(); spaceDown.current = true; }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) useProject.getState().undo();
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) useProject.getState().redo();

      const nudge = e.shiftKey ? 10 : 1;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) && selection.ids.length > 0) {
        e.preventDefault();
        const dx = e.key === 'ArrowLeft' ? -nudge : e.key === 'ArrowRight' ? nudge : 0;
        const dy = e.key === 'ArrowUp' ? -nudge : e.key === 'ArrowDown' ? nudge : 0;
        useProject.getState().moveModulesBy(selection.ids, dx, dy);
      }
    };
    const onKeyUp = (e) => { if (e.key === ' ') spaceDown.current = false; };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKeyUp); };
  }, [selection.ids]);

  // Wheel zoom
  const onWheel = useCallback((e) => {
    e.evt.preventDefault();
    const scaleBy = 1.08;
    const stage = stageRef.current;
    if (!stage) return;
    const oldZoom = zoom;
    const pointer = stage.getPointerPosition();
    const newZoom = e.evt.deltaY < 0 ? oldZoom * scaleBy : oldZoom / scaleBy;
    useProject.getState().setProjectCanvasZoom(newZoom);
    const mousePointTo = {
      x: (pointer.x - pan.x) / oldZoom,
      y: (pointer.y - pan.y) / oldZoom,
    };
    setPan({
      x: pointer.x - mousePointTo.x * newZoom,
      y: pointer.y - mousePointTo.y * newZoom,
    });
  }, [zoom, pan]);

  // Mouse move for pan and mouse pos reporting
  const onMouseMove = useCallback((e) => {
    const stage = stageRef.current;
    if (!stage) return;
    const pos = stage.getPointerPosition();
    const worldX = (pos.x - pan.x) / zoom;
    const worldY = (pos.y - pan.y) / zoom;
    onMousePos?.({ x: Math.round(worldX), y: Math.round(worldY) });

    if (isPanning.current) {
      const dx = e.evt.clientX - lastPan.current.x;
      const dy = e.evt.clientY - lastPan.current.y;
      lastPan.current = { x: e.evt.clientX, y: e.evt.clientY };
      setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
    }
  }, [pan, zoom, onMousePos]);

  const onMouseDown = useCallback((e) => {
    if (spaceDown.current || e.evt.button === 1) {
      isPanning.current = true;
      lastPan.current = { x: e.evt.clientX, y: e.evt.clientY };
      e.evt.preventDefault();
    }
  }, []);

  const onMouseUp = useCallback(() => { isPanning.current = false; }, []);

  // Click on stage background = deselect
  const onStageClick = useCallback((e) => {
    if (e.target === e.target.getStage()) {
      setSelection([]);
    }
  }, [setSelection]);

  // Place module on double-click
  const onStageDblClick = useCallback((e) => {
    const { activeType, project: proj } = useProject.getState();
    if (!activeType) return;
    const stage = stageRef.current;
    if (!stage) return;
    const pos = stage.getPointerPosition();
    let wx = (pos.x - pan.x) / zoom;
    let wy = (pos.y - pan.y) / zoom;
    if (proj.canvas.snapEnabled) {
      wx = snapVal(wx, proj.canvas.gridSize);
      wy = snapVal(wy, proj.canvas.gridSize);
    }
    pushHistory();
    addModule(activeType, Math.round(wx), Math.round(wy));
  }, [pan, zoom, pushHistory, addModule]);

  // Grid lines
  const gridLines = [];
  if (canvas.showGrid) {
    const gs = canvas.gridSize;
    const startX = Math.floor(-pan.x / zoom / gs) * gs;
    const startY = Math.floor(-pan.y / zoom / gs) * gs;
    const endX = startX + size.w / zoom + gs * 2;
    const endY = startY + size.h / zoom + gs * 2;
    for (let x = startX; x < endX; x += gs) {
      gridLines.push(<Line key={`vg${x}`} points={[x, startY, x, endY]} stroke={canvas.gridColor} strokeWidth={0.5 / zoom} opacity={0.4} />);
    }
    for (let y = startY; y < endY; y += gs) {
      gridLines.push(<Line key={`hg${y}`} points={[startX, y, endX, y]} stroke={canvas.gridColor} strokeWidth={0.5 / zoom} opacity={0.4} />);
    }
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden"
      style={{ background: canvas.viewportBg, cursor: spaceDown.current ? 'grab' : 'default' }}
    >
      <Stage
        ref={stageRef}
        width={size.w}
        height={size.h}
        onWheel={onWheel}
        onMouseMove={onMouseMove}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onClick={onStageClick}
        onDblClick={onStageDblClick}
      >
        <Layer x={pan.x} y={pan.y} scaleX={zoom} scaleY={zoom}>
          {/* Canvas background */}
          <Rect x={0} y={0} width={canvas.widthPx} height={canvas.heightPx} fill={canvas.canvasBg} />

          {/* Grid */}
          {gridLines}

          {/* Canvas border */}
          <Rect
            x={0} y={0}
            width={canvas.widthPx} height={canvas.heightPx}
            stroke="#444" strokeWidth={1 / zoom} fill="transparent"
          />

          {/* Group overlays */}
          {project.groups.map((g) => (
            <GroupOverlay key={g.id} group={g} zoom={zoom} />
          ))}

          {/* Modules */}
          {project.modules.map((m) => (
            <ModuleRect key={m.id} module={m} zoom={zoom} />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}