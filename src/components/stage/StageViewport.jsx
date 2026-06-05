import { useRef, useState, useEffect, useCallback } from 'react';
import { Stage, Layer, Rect, Text, Line } from 'react-konva';
import { useProject } from '@/store/projectStore';
import ModuleRect from './ModuleRect';
import GroupOverlay from './GroupOverlay';

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

  // Grid drag placement state
  const [dragRect, setDragRect] = useState(null); // { x, y, w, h } in world coords
  const dragStart = useRef(null); // world coords where drag started

  const {
    project,
    selection,
    setSelection,
    setModulesXY,
    pushHistory,
    addModule,
    bulkAddModules,
    removeModules,
    stageRef: storeStageRef,
  } = useProject();

  const { canvas } = project;
  const zoom = canvas.zoom ?? 1;

  useEffect(() => {
    if (stageRef.current) storeStageRef.current = stageRef.current;
  }, [stageRef.current]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && selection.ids.length > 0) removeModules(selection.ids);
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

  const getWorldPos = useCallback((stage) => {
    const pos = stage.getPointerPosition();
    return {
      x: (pos.x - pan.x) / zoom,
      y: (pos.y - pan.y) / zoom,
    };
  }, [pan, zoom]);

  const onWheel = useCallback((e) => {
    e.evt.preventDefault();
    const scaleBy = 1.08;
    const stage = stageRef.current;
    if (!stage) return;
    const oldZoom = zoom;
    const pointer = stage.getPointerPosition();
    const newZoom = e.evt.deltaY < 0 ? oldZoom * scaleBy : oldZoom / scaleBy;
    useProject.getState().setProjectCanvasZoom(newZoom);
    const mousePointTo = { x: (pointer.x - pan.x) / oldZoom, y: (pointer.y - pan.y) / oldZoom };
    setPan({ x: pointer.x - mousePointTo.x * newZoom, y: pointer.y - mousePointTo.y * newZoom });
  }, [zoom, pan]);

  const onMouseMove = useCallback((e) => {
    const stage = stageRef.current;
    if (!stage) return;
    const { x: wx, y: wy } = getWorldPos(stage);
    onMousePos?.({ x: Math.round(wx), y: Math.round(wy) });

    if (isPanning.current) {
      const dx = e.evt.clientX - lastPan.current.x;
      const dy = e.evt.clientY - lastPan.current.y;
      lastPan.current = { x: e.evt.clientX, y: e.evt.clientY };
      setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
    } else if (dragStart.current) {
      const sx = dragStart.current.x;
      const sy = dragStart.current.y;
      setDragRect({
        x: Math.min(sx, wx),
        y: Math.min(sy, wy),
        w: Math.abs(wx - sx),
        h: Math.abs(wy - sy),
      });
    }
  }, [pan, zoom, onMousePos, getWorldPos]);

  const onMouseDown = useCallback((e) => {
    if (spaceDown.current || e.evt.button === 1) {
      isPanning.current = true;
      lastPan.current = { x: e.evt.clientX, y: e.evt.clientY };
      e.evt.preventDefault();
      return;
    }
    // Only start grid drag if activeType is set and clicking on stage bg
    const { activeType } = useProject.getState();
    if (activeType && e.target === e.target.getStage()) {
      const stage = stageRef.current;
      if (!stage) return;
      const { x, y } = getWorldPos(stage);
      dragStart.current = { x, y };
      setDragRect({ x, y, w: 0, h: 0 });
    }
  }, [getWorldPos]);

  const onMouseUp = useCallback((e) => {
    isPanning.current = false;

    if (dragStart.current && dragRect) {
      const { activeType, project: proj } = useProject.getState();
      if (activeType && (dragRect.w > 5 || dragRect.h > 5)) {
        const type = proj.moduleTypes.find((t) => t.id === activeType);
        if (type) {
          const cols = Math.max(1, Math.round(dragRect.w / type.widthPx));
          const rows = Math.max(1, Math.round(dragRect.h / type.heightPx));
          const items = [];
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              items.push({
                typeId: activeType,
                x: Math.round(dragRect.x + c * type.widthPx),
                y: Math.round(dragRect.y + r * type.heightPx),
              });
            }
          }
          if (items.length > 0) bulkAddModules(items);
        }
      } else if (activeType && dragRect.w <= 5 && dragRect.h <= 5) {
        // Single click — place one
        const { project: proj } = useProject.getState();
        let wx = dragStart.current.x;
        let wy = dragStart.current.y;
        if (proj.canvas.snapEnabled) {
          wx = snapVal(wx, proj.canvas.gridSize);
          wy = snapVal(wy, proj.canvas.gridSize);
        }
        pushHistory();
        addModule(activeType, Math.round(wx), Math.round(wy));
      }
    }

    dragStart.current = null;
    setDragRect(null);
  }, [dragRect, pushHistory, addModule, bulkAddModules]);

  const onStageClick = useCallback((e) => {
    if (!dragStart.current && e.target === e.target.getStage()) {
      setSelection([]);
    }
  }, [setSelection]);

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

  // Compute drag preview grid
  let dragPreview = null;
  if (dragRect && dragRect.w > 5) {
    const { activeType, project: proj } = useProject.getState();
    const type = proj.moduleTypes.find((t) => t.id === activeType);
    if (type) {
      const cols = Math.max(1, Math.round(dragRect.w / type.widthPx));
      const rows = Math.max(1, Math.round(dragRect.h / type.heightPx));
      const snappedW = cols * type.widthPx;
      const snappedH = rows * type.heightPx;
      const cells = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          cells.push(
            <Rect
              key={`pc${r}-${c}`}
              x={dragRect.x + c * type.widthPx}
              y={dragRect.y + r * type.heightPx}
              width={type.widthPx}
              height={type.heightPx}
              fill="rgba(139,92,246,0.15)"
              stroke="rgba(139,92,246,0.8)"
              strokeWidth={1 / zoom}
            />
          );
        }
      }
      dragPreview = (
        <>
          {cells}
          <Text
            x={dragRect.x + snappedW / 2 - 30}
            y={dragRect.y + snappedH / 2 - 10}
            text={`${cols} × ${rows}`}
            fontSize={14 / zoom}
            fill="#a78bfa"
            fontStyle="bold"
            listening={false}
          />
        </>
      );
    }
  }

  const { activeType } = useProject.getState();
  const cursorStyle = spaceDown.current ? 'grab' : activeType ? 'crosshair' : 'default';

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden"
      style={{ background: canvas.viewportBg, cursor: cursorStyle }}
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
      >
        <Layer x={pan.x} y={pan.y} scaleX={zoom} scaleY={zoom}>
          <Rect x={0} y={0} width={canvas.widthPx} height={canvas.heightPx} fill={canvas.canvasBg} />
          {gridLines}
          <Rect x={0} y={0} width={canvas.widthPx} height={canvas.heightPx} stroke="#444" strokeWidth={1 / zoom} fill="transparent" />
          {project.groups.map((g) => <GroupOverlay key={g.id} group={g} zoom={zoom} />)}
          {project.modules.map((m) => <ModuleRect key={m.id} module={m} zoom={zoom} />)}
          {dragPreview}
        </Layer>
      </Stage>
    </div>
  );
}