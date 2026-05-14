import { MousePointer2, Paintbrush, Eraser, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const tools = [
  { id: 'select', label: 'Select', icon: MousePointer2 },
  { id: 'paint', label: 'Paint', icon: Paintbrush },
  { id: 'erase', label: 'Erase', icon: Eraser },
];

export default function CanvasToolbar({ activeTool, onToolChange, onClearAll }) {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 p-1 bg-card border border-border rounded-lg">
        {tools.map(({ id, label, icon: Icon }) => (
          <Tooltip key={id}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "w-8 h-8 transition-all",
                  activeTool === id
                    ? "bg-primary/20 text-primary border border-primary/40"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
                onClick={() => onToolChange(id)}
              >
                <Icon className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">{label}</TooltipContent>
          </Tooltip>
        ))}

        <div className="w-px h-5 bg-border mx-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={onClearAll}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">Clear All Pixels</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}