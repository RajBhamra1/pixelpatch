import { Layers, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function FixturePicker({ fixtures, onAdd }) {
  if (!fixtures.length) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        <p>No fixtures yet.</p>
        <p className="text-xs mt-1">Go to Fixtures to add some.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="max-h-60">
      <div className="space-y-1 p-2">
        {fixtures.map(f => {
          const isPanel = f.type === 'panel';
          const res = isPanel
            ? `${f.cols ?? '?'}×${f.rows ?? '?'}`
            : `${f.pixel_count ?? '?'}px`;
          const pitch = f.pixel_pitch_mm ? ` P${f.pixel_pitch_mm}` : '';
          return (
            <div key={f.id} className="flex items-center gap-2 p-2 rounded hover:bg-secondary transition-colors group">
              <div className={`flex items-center justify-center w-7 h-7 rounded shrink-0 ${isPanel ? 'bg-neon-cyan/10' : 'bg-primary/10'}`}>
                {isPanel
                  ? <Layers className="w-3.5 h-3.5 text-neon-cyan" />
                  : <Minus className="w-3.5 h-3.5 text-primary" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{f.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{res}{pitch}</p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="w-6 h-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary shrink-0"
                onClick={() => onAdd(f)}
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}