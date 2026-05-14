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
        {fixtures.map(f => (
          <div key={f.id} className="flex items-center gap-2 p-2 rounded hover:bg-secondary transition-colors group">
            <div className={`flex items-center justify-center w-7 h-7 rounded ${f.type === 'panel' ? 'bg-neon-cyan/10' : 'bg-primary/10'}`}>
              {f.type === 'panel'
                ? <Layers className="w-3.5 h-3.5 text-neon-cyan" />
                : <Minus className="w-3.5 h-3.5 text-primary" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{f.name}</p>
              <p className="text-xs text-muted-foreground">
                {f.type === 'panel' ? `${f.rows}×${f.cols}` : `${f.pixel_count}px`}
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="w-6 h-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary"
              onClick={() => onAdd(f)}
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}