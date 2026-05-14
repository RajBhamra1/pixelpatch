import { Trash2, Layers, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function FixtureCard({ fixture, onDelete }) {
  const isPanel = fixture.type === 'panel';

  return (
    <div className="group flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:border-primary/40 transition-all duration-200">
      <div className={`flex items-center justify-center w-9 h-9 rounded-md ${isPanel ? 'bg-neon-cyan/10 border border-neon-cyan/30' : 'bg-primary/10 border border-primary/30'}`}>
        {isPanel ? (
          <Layers className="w-4 h-4 text-neon-cyan" />
        ) : (
          <Minus className="w-4 h-4 text-primary" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{fixture.name}</p>
        <p className="text-xs text-muted-foreground">
          {isPanel
            ? `${fixture.rows ?? 8}×${fixture.cols ?? 8} panel · ${(fixture.rows ?? 8) * (fixture.cols ?? 8)} px`
            : `${fixture.pixel_count ?? 30} px strip`}
        </p>
      </div>

      <Badge
        variant="outline"
        className={`text-xs shrink-0 ${isPanel ? 'border-neon-cyan/40 text-neon-cyan' : 'border-primary/40 text-primary'}`}
      >
        {isPanel ? 'Panel' : 'Strip'}
      </Badge>

      <Button
        variant="ghost"
        size="icon"
        className="opacity-0 group-hover:opacity-100 w-7 h-7 text-muted-foreground hover:text-destructive transition-all"
        onClick={() => onDelete(fixture.id)}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}