import { useState } from 'react';
import AppSidebar from '@/components/sidebar/AppSidebar';
import StageViewport from '@/components/stage/StageViewport';
import StageToolbar from '@/components/stage/StageToolbar';
import StatusBar from '@/components/stage/StatusBar';

export default function CanvasEditor() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      <AppSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <StageToolbar />
        <div className="flex-1 overflow-hidden">
          <StageViewport onMousePos={setMousePos} />
        </div>
        <StatusBar mousePos={mousePos} />
      </div>
    </div>
  );
}