import { useProject } from '@/store/projectStore';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw, Undo2, Redo2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function StageToolbar() {
  const { project, setProjectCanvasZoom, undo, redo, _undoStack, _redoStack } = useProject();
  const zoom = project.canvas.zoom ?? 1;

  return (
    <TooltipProvider>
      <div className="h-9 shrink-0 bg-card border-b border-border flex items-center gap-1 px-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setProjectCanvasZoom(1)}>
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">Reset Zoom</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setProjectCanvasZoom(zoom * 1.2)}>
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">Zoom In</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setProjectCanvasZoom(zoom / 1.2)}>
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">Zoom Out</TooltipContent>
        </Tooltip>

        <div className="w-px h-5 bg-border mx-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="w-7 h-7" disabled={!_undoStack?.length} onClick={undo}>
              <Undo2 className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">Undo (Ctrl+Z)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="w-7 h-7" disabled={!_redoStack?.length} onClick={redo}>
              <Redo2 className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">Redo (Ctrl+Y)</TooltipContent>
        </Tooltip>

        <div className="ml-auto text-xs font-mono text-muted-foreground">
          {(zoom * 100).toFixed(0)}% · dbl-click to place
        </div>
      </div>
    </TooltipProvider>
  );
}