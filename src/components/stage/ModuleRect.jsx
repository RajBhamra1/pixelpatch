import { useRef, useMemo } from 'react';
import { Rect, Text, Group, Line } from 'react-konva';
import { useProject } from '@/store/projectStore';

const SNAP = (v, g) => Math.round(v / Math.max(g, 1)) * Math.max(g, 1);

// Only draw pixel grid lines if there aren't too many (perf guard)
const MAX_PIXEL_LINES = 120;

export default function ModuleRect({ module: mod, zoom }) {
  const { project, selection, setSelection, setModulesXY, pushHistory } = useProject();
  const isDragging = useRef(false);

  const type = project.moduleTypes.find((t) => t.id === mod.typeId);

  const isSelected = selection.ids.includes(mod.id);
  const { canvas } = project;
  const panelBg = mod.fill || '#000000';
  const labelFs = canvas.labelFontSize || 11;
  const labelColor = canvas.labelTextColor || '#ffffff';
  const labelBg = canvas.labelBg || 'rgba(0,0,0,0.75)';

  const cols = type?.cols || 0;
  const rows = type?.rows || 0;
  const W = type?.widthPx || 0;
  const H = type?.heightPx || 0;
  const label = mod.label || type?.name || '';

  // Pixel grid lines — drawn only when there aren't too many
  const pixelLines = useMemo(() => {
    if (!type || !canvas.showPixelGrid || cols <= 1 || rows <= 1) return null;
    if (cols > MAX_PIXEL_LINES && rows > MAX_PIXEL_LINES) return null;

    const lines = [];
    const cellW = W / cols;
    const cellH = H / rows;
    const stroke = 'rgba(255,255,255,0.06)';
    const sw = 0.5 / zoom;

    // Vertical lines
    if (cols <= MAX_PIXEL_LINES) {
      for (let c = 1; c < cols; c++) {
        lines.push(<Line key={`v${c}`} points={[c * cellW, 0, c * cellW, H]} stroke={stroke} strokeWidth={sw} listening={false} />);
      }
    }
    // Horizontal lines
    if (rows <= MAX_PIXEL_LINES) {
      for (let r = 1; r < rows; r++) {
        lines.push(<Line key={`h${r}`} points={[0, r * cellH, W, r * cellH]} stroke={stroke} strokeWidth={sw} listening={false} />);
      }
    }
    return lines;
  }, [type, cols, rows, W, H, zoom, canvas.showPixelGrid]);

  // Resolution string
  const resText = cols && rows ? `${cols}×${rows}` : '';
  const pitchText = type?.pitch ? ` p${type.pitch}` : '';

  if (!type) return null;

  return (
    <Group
      x={mod.x}
      y={mod.y}
      draggable
      onDragStart={() => {
        isDragging.current = true;
        pushHistory();
        if (!selection.ids.includes(mod.id)) setSelection([mod.id]);
      }}
      onDragMove={(e) => {
        const node = e.target;
        const { canvas: cv } = useProject.getState().project;
        let nx = node.x();
        let ny = node.y();
        if (cv.snapEnabled) { nx = SNAP(nx, cv.gridSize); ny = SNAP(ny, cv.gridSize); node.x(nx); node.y(ny); }
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
        const { canvas: cv } = useProject.getState().project;
        let nx = node.x();
        let ny = node.y();
        if (cv.snapEnabled) { nx = SNAP(nx, cv.gridSize); ny = SNAP(ny, cv.gridSize); }
        const ids = useProject.getState().selection.ids;
        if (ids.length <= 1) setModulesXY({ [mod.id]: { x: nx, y: ny } });
      }}
      onClick={(e) => {
        e.cancelBubble = true;
        if (e.evt.shiftKey) {
          setSelection((prev) => prev.includes(mod.id) ? prev.filter((id) => id !== mod.id) : [...prev, mod.id]);
        } else {
          setSelection([mod.id]);
        }
      }}
    >
      {/* Panel body */}
      <Rect
        width={W}
        height={H}
        fill={panelBg}
        stroke={isSelected ? '#a855f7' : '#444'}
        strokeWidth={isSelected ? 2 / zoom : 1 / zoom}
        shadowColor={isSelected ? '#a855f7' : undefined}
        shadowBlur={isSelected ? 10 / zoom : 0}
        shadowOpacity={isSelected ? 0.9 : 0}
        cornerRadius={1 / zoom}
      />

      {/* Pixel grid */}
      {pixelLines}

      {/* Corner dot markers — show pixel positions at corners when zoomed in enough */}
      {zoom > 0.5 && cols > 0 && rows > 0 && (() => {
        const cellW = W / cols;
        const cellH = H / rows;
        const dotR = Math.min(cellW, cellH) * 0.28;
        if (dotR * zoom < 1.5) return null; // too small to see
        const dots = [];
        const maxDots = 40;
        const stepC = Math.max(1, Math.ceil(cols / maxDots));
        const stepR = Math.max(1, Math.ceil(rows / maxDots));
        for (let r = 0; r < rows; r += stepR) {
          for (let c = 0; c < cols; c += stepC) {
            dots.push(
              <Rect
                key={`d${r}-${c}`}
                x={c * cellW + cellW / 2 - dotR / 2}
                y={r * cellH + cellH / 2 - dotR / 2}
                width={dotR}
                height={dotR}
                fill="rgba(255,255,255,0.55)"
                cornerRadius={dotR / 2}
                listening={false}
              />
            );
          }
        }
        return dots;
      })()}

      {/* Label bar */}
      <Rect
        x={0}
        y={0}
        width={W}
        height={(labelFs + 6) / zoom}
        fill={labelBg}
        listening={false}
      />
      <Text
        x={4 / zoom}
        y={3 / zoom}
        text={label}
        fontSize={labelFs / zoom}
        fill={labelColor}
        fontFamily="JetBrains Mono, monospace"
        listening={false}
      />
      {/* Pixel count info — bottom right */}
      {resText && (
        <Text
          x={W - (resText.length + pitchText.length + 1) * (labelFs * 0.6) / zoom}
          y={H - (labelFs + 4) / zoom}
          text={resText + pitchText}
          fontSize={(labelFs - 1) / zoom}
          fill="rgba(255,255,255,0.4)"
          fontFamily="JetBrains Mono, monospace"
          listening={false}
        />
      )}
    </Group>
  );
}