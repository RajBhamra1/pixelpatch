import { Trash2, Layers, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const BRAND_COLORS = {
  'ROE Visual': 'border-primary/40 text-primary bg-primary/5',
  'Absen': 'border-neon-cyan/40 text-neon-cyan bg-neon-cyan/5',
  'Aluvision': 'border-neon-pink/40 text-neon-pink bg-neon-pink/5',
  'Custom': 'border-muted-foreground/30 text-muted-foreground',
};

export default function FixtureCard({ fixture, onDelete }) {
  const isPanel = fixture.type === 'panel';
  const brand = fixture.brand ?? 'Custom';
  const brandColor = BRAND_COLORS[brand] ?? BRAND_COLORS['Custom'];

  const pixelInfo = isPanel
    ? `${fixture.cols ?? '?'} × ${fixture.rows ?? '?'} px`
    : `${fixture.pixel_count ?? '?'} px`;

  const physInfo = isPanel && fixture.panel_width_mm
    ? `${fixture.panel_width_mm}×${fixture.panel_height_mm}mm`
    : '';

  return (
    <div className="group flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:border-primary/30 transition-all duration-200">
      <div className={`flex items-center justify-center w-9 h-9 rounded-md shrink-0 ${isPanel ? 'bg-neon-cyan/10 border border-neon-cyan/20' : 'bg-primary/10 border border-primary/20'}`}>
        {isPanel
          ? <Layers className="w-4 h-4 text-neon-cyan" />
          : <Minus className="w-4 h-4 text-primary" />
        }
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-foreground truncate">{fixture.name}</p>
          {fixture.model && (
            <span className="text-xs font-mono text-muted-foreground/70 shrink-0">{fixture.model}</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs text-muted-foreground font-mono">{pixelInfo}</span>
          {fixture.pixel_pitch_mm && (
            <span className="text-xs text-muted-foreground font-mono">P{fixture.pixel_pitch_mm}</span>
          )}
          {physInfo && (
            <span className="text-xs text-muted-foreground/60 font-mono">{physInfo}</span>
          )}
          {fixture.description && (
            <span className="text-xs text-muted-foreground/50 truncate hidden sm:block">{fixture.description}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {brand !== 'Custom' && (
          <Badge variant="outline" className={`text-xs ${brandColor}`}>
            {brand}
          </Badge>
        )}
        <Badge
          variant="outline"
          className={`text-xs ${isPanel ? 'border-neon-cyan/30 text-neon-cyan/80' : 'border-primary/30 text-primary/80'}`}
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
    </div>
  );
}