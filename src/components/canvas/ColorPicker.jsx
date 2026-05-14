import { useState } from 'react';

const PALETTE = [
  '#FF0000', '#FF4400', '#FF8800', '#FFCC00', '#FFFF00',
  '#88FF00', '#00FF00', '#00FF88', '#00FFFF', '#0088FF',
  '#0000FF', '#8800FF', '#FF00FF', '#FF0088', '#FFFFFF',
  '#AAAAAA', '#555555', '#222222', '#000000',
  '#FF6666', '#66FF66', '#6666FF', '#FF66FF', '#66FFFF',
];

export default function ColorPicker({ color, onChange }) {
  const [hex, setHex] = useState(color || '#FF0000');

  const handleHexChange = (val) => {
    setHex(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      onChange(val);
    }
  };

  const handleSelect = (c) => {
    setHex(c);
    onChange(c);
  };

  return (
    <div className="space-y-3">
      {/* Current color preview */}
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded border border-border shrink-0"
          style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}80` }}
        />
        <input
          type="text"
          value={hex}
          onChange={e => handleHexChange(e.target.value)}
          className="flex-1 bg-muted border border-border rounded px-2 py-1 text-xs font-mono text-foreground uppercase"
          maxLength={7}
        />
        <input
          type="color"
          value={color}
          onChange={e => handleSelect(e.target.value)}
          className="w-8 h-8 rounded border border-border bg-transparent cursor-pointer"
        />
      </div>

      {/* Palette */}
      <div className="grid grid-cols-5 gap-1">
        {PALETTE.map(c => (
          <button
            key={c}
            className="w-full aspect-square rounded transition-transform hover:scale-110 border-2"
            style={{
              backgroundColor: c,
              borderColor: color === c ? '#fff' : 'transparent',
              boxShadow: color === c ? `0 0 6px ${c}` : 'none',
            }}
            onClick={() => handleSelect(c)}
          />
        ))}
      </div>
    </div>
  );
}