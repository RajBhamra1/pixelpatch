import { useRef } from 'react';
import { Trash2, Move } from 'lucide-react';

const PIXEL_SIZE = 14;
const PIXEL_GAP = 2;

export default function PlacedFixture({ fixture, isSelected, paintColor, paintMode, onSelect, onRemove, onPixelPaint, onDragStart }) {
  const isPanel = fixture.fixture_type === 'panel';
  const rows = fixture.rows ?? 1;
  const cols = fixture.cols ?? fixture.pixel_count ?? 30;
  const total = rows * cols;
  const colors = fixture.pixel_colors ?? Array(total).fill('#222222');

  const handlePixelClick = (idx) => {
    if (!paintMode) return;
    onPixelPaint(fixture.id, idx, paintColor);
  };

  const cellSize = PIXEL_SIZE + PIXEL_GAP;

  const fixtureW = isPanel ? cols * cellSize + PIXEL_GAP : cols * cellSize + PIXEL_GAP;
  const fixtureH = isPanel ? rows * cellSize + PIXEL_GAP : cellSize + PIXEL_GAP;

  return (
    <div
      className={`absolute group select-none`}
      style={{ left: fixture.x, top: fixture.y }}
      onClick={(e) => { e.stopPropagation(); onSelect(fixture.id); }}
    >
      {/* Drag handle / selection ring */}
      <div
        className={`relative rounded p-1 border transition-all duration-150 ${
          isSelected
            ? 'border-primary/80 bg-primary/5'
            : 'border-transparent hover:border-border'
        }`}
        style={{ minWidth: fixtureW + 8, minHeight: fixtureH + 8 }}
      >
        {/* Pixel grid */}
        <div
          className="relative"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, ${PIXEL_SIZE}px)`,
            gap: `${PIXEL_GAP}px`,
          }}
        >
          {Array.from({ length: total }).map((_, idx) => {
            const c = colors[idx] || '#111111';
            return (
              <div
                key={idx}
                className="rounded-sm cursor-crosshair transition-all duration-75"
                style={{
                  width: PIXEL_SIZE,
                  height: PIXEL_SIZE,
                  backgroundColor: c,
                  boxShadow: c !== '#111111' && c !== '#222222' && c !== '#000000'
                    ? `0 0 ${PIXEL_SIZE / 2}px ${c}99, 0 0 ${PIXEL_SIZE}px ${c}44`
                    : 'none',
                }}
                onClick={(e) => { e.stopPropagation(); handlePixelClick(idx); }}
              />
            );
          })}
        </div>

        {/* Fixture label */}
        <div className="absolute -top-5 left-0 right-0 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs text-muted-foreground font-mono truncate max-w-[80px]">{fixture.fixture_name}</span>
        </div>

        {/* Controls (shown when selected) */}
        {isSelected && (
          <div className="absolute -top-7 right-0 flex items-center gap-1">
            <div
              className="flex items-center justify-center w-5 h-5 rounded bg-card border border-border text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
              onMouseDown={(e) => onDragStart(e, fixture.id)}
            >
              <Move className="w-3 h-3" />
            </div>
            <button
              className="flex items-center justify-center w-5 h-5 rounded bg-card border border-border text-muted-foreground hover:text-destructive transition-colors"
              onClick={(e) => { e.stopPropagation(); onRemove(fixture.id); }}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}