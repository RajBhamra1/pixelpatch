import { useState, useRef } from 'react';
import AppSidebar from '@/components/sidebar/AppSidebar';
import StageViewport from '@/components/stage/StageViewport';
import StageToolbar from '@/components/stage/StageToolbar';
import StatusBar from '@/components/stage/StatusBar';

export default function CanvasEditor() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const fitFnRef = useRef(null);

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      <AppSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <StageToolbar onFit={() => fitFnRef.current?.()} />
        <div className="flex-1 overflow-hidden">
          <StageViewport onMousePos={setMousePos} onFitReady={(fn) => { fitFnRef.current = fn; }} />
        </div>
        <StatusBar mousePos={mousePos} />
      </div>
    </div>
  );
}