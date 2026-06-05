import { Rect, Text } from 'react-konva';
import { useProject } from '@/store/projectStore';

export default function GroupOverlay({ group, zoom }) {
  const { project } = useProject();

  const rects = [];
  for (const id of group.memberIds || []) {
    const m = project.modules.find((mm) => mm.id === id);
    if (!m) continue;
    const t = project.moduleTypes.find((tt) => tt.id === m.typeId);
    if (!t) continue;
    rects.push({ x: m.x, y: m.y, w: t.widthPx, h: t.heightPx });
  }
  if (!rects.length) return null;

  const minX = Math.min(...rects.map((r) => r.x));
  const minY = Math.min(...rects.map((r) => r.y));
  const maxX = Math.max(...rects.map((r) => r.x + r.w));
  const maxY = Math.max(...rects.map((r) => r.y + r.h));
  const pad = 4 / zoom;

  const color = group.color || '#4a90e2';
  const bw = (group.borderWidth || 2) / zoom;
  const fs = (group.fontSize || 14) / zoom;

  return (
    <>
      <Rect
        x={minX - pad}
        y={minY - pad}
        width={maxX - minX + pad * 2}
        height={maxY - minY + pad * 2}
        stroke={color}
        strokeWidth={bw}
        fill={color}
        opacity={0.08}
        dash={group.borderStyle === 'dashed' ? [8 / zoom, 4 / zoom] : undefined}
      />
      <Text
        x={minX - pad}
        y={minY - pad - fs - 2 / zoom}
        text={group.name}
        fontSize={fs}
        fill={group.labelTextColor || '#ffffff'}
        fontStyle="bold"
      />
    </>
  );
}