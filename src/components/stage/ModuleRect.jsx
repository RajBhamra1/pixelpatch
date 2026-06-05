import { useRef } from 'react';
import { Rect, Text, Group } from 'react-konva';
import { useProject } from '@/store/projectStore';

export default function ModuleRect({ module: mod, zoom }) {
  const { project, selection, setSelection, setModulesXY, pushHistory, updateCanvas } = useProject();
  const isDragging = useRef(false);
  const didMove = useRef(false);

  const type = project.moduleTypes.find((t) => t.id === mod.typeId);
  if (!type) return null;

  const isSelected = selection.ids.includes(mod.id);
  const fill = mod.fill || project.canvas.canvasBg || '#1a1a2e';
  const labelFs = project.canvas.labelFontSize || 12;
  const labelBg = project.canvas.labelBg || 'rgba(0,0,0,0.7)';
  const labelColor = project.canvas.labelTextColor || '#ffffff';
  const label = mod.label || type.name;

  const snapVal = (v, g) => Math.round(v / Math.max(g, 1)) * Math.max(g, 1);

  return (
    <Group
      x={mod.x}
      y={mod.y}
      draggable
      onDragStart={() => {
        isDragging.current = true;
        didMove.current = false;
        pushHistory();
        // If not in selection, select it
        if (!selection.ids.includes(mod.id)) {
          setSelection([mod.id]);
        }
      }}
      onDragMove={(e) => {
        didMove.current = true;
        const node = e.target;
        const { canvas } = useProject.getState().project;
        let nx = node.x();
        let ny = node.y();
        if (canvas.snapEnabled) {
          nx = snapVal(nx, canvas.gridSize);
          ny = snapVal(ny, canvas.gridSize);
          node.x(nx);
          node.y(ny);
        }
        // Move all selected modules together
        const ids = useProject.getState().selection.ids;
        if (ids.length > 1 && ids.includes(mod.id)) {
          const dx = nx - mod.x;
          const dy = ny - mod.y;
          const updates = {};
          for (const id of ids) {
            if (id === mod.id) { updates[id] = { x: nx, y: ny }; continue; }
            const m = useProject.getState().project.modules.find((mm) => mm.id === id);
            if (m) updates[id] = { x: m.x + dx, y: m.y + dy };
          }
          setModulesXY(updates);
          node.x(nx); node.y(ny);
        }
      }}
      onDragEnd={(e) => {
        isDragging.current = false;
        const node = e.target;
        const { canvas } = useProject.getState().project;
        let nx = node.x();
        let ny = node.y();
        if (canvas.snapEnabled) {
          nx = snapVal(nx, canvas.gridSize);
          ny = snapVal(ny, canvas.gridSize);
        }
        const ids = useProject.getState().selection.ids;
        if (ids.length <= 1) {
          setModulesXY({ [mod.id]: { x: nx, y: ny } });
        }
      }}
      onClick={(e) => {
        e.cancelBubble = true;
        if (e.evt.shiftKey) {
          setSelection((prev) =>
            prev.includes(mod.id) ? prev.filter((id) => id !== mod.id) : [...prev, mod.id]
          );
        } else {
          setSelection([mod.id]);
        }
      }}
    >
      <Rect
        width={type.widthPx}
        height={type.heightPx}
        fill={fill}
        stroke={isSelected ? '#a855f7' : '#555'}
        strokeWidth={isSelected ? 2 / zoom : 0.5 / zoom}
        shadowColor={isSelected ? '#a855f7' : undefined}
        shadowBlur={isSelected ? 8 / zoom : 0}
        shadowOpacity={isSelected ? 0.8 : 0}
      />
      {/* Label background */}
      <Rect
        x={2 / zoom}
        y={2 / zoom}
        width={type.widthPx - 4 / zoom}
        height={(labelFs + 4) / zoom}
        fill={labelBg}
        cornerRadius={2 / zoom}
      />
      <Text
        x={4 / zoom}
        y={4 / zoom}
        text={label}
        fontSize={labelFs / zoom}
        fill={labelColor}
        fontFamily="JetBrains Mono, monospace"
      />
    </Group>
  );
}