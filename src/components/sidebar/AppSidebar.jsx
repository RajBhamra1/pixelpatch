import { useProject } from '@/store/projectStore';
import ModulesPanel from './ModulesPanel';
import CanvasSettingsPanel from './CanvasSettingsPanel';
import GroupsPanel from './GroupsPanel';
import AssetsPanel from './AssetsPanel';
import ExportPanel from './ExportPanel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Grid3X3, Magnet } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AppSidebar() {
  const { project, setProjectCanvasShowGrid, toggleSnapEnabled } = useProject();

  return (
    <div className="w-64 shrink-0 bg-card border-r border-border flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-border flex items-center justify-between shrink-0">
        <span className="text-sm font-semibold text-foreground">PixelMapper</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost" size="icon"
            className={`w-7 h-7 ${project.canvas.showGrid ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}
            title="Toggle Grid"
            onClick={() => setProjectCanvasShowGrid(!project.canvas.showGrid)}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost" size="icon"
            className={`w-7 h-7 ${project.canvas.snapEnabled ? 'text-neon-cyan bg-neon-cyan/10' : 'text-muted-foreground'}`}
            title="Toggle Snap"
            onClick={toggleSnapEnabled}
          >
            <Magnet className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <ModulesPanel />
        <CanvasSettingsPanel />
        <GroupsPanel />
        <AssetsPanel />
        <ExportPanel />
      </ScrollArea>
    </div>
  );
}