import { useState, useRef, useCallback, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PlacedFixture from '@/components/canvas/PlacedFixture';
import ColorPicker from '@/components/canvas/ColorPicker';
import CanvasToolbar from '@/components/canvas/CanvasToolbar';
import FixturePicker from '@/components/canvas/FixturePicker';
import SceneSelector from '@/components/canvas/SceneSelector';
import { Separator } from '@/components/ui/separator';
import { nanoid } from '@/utils/nanoid';

export default function CanvasEditor() {
  const qc = useQueryClient();
  const canvasRef = useRef(null);

  const [activeScene, setActiveScene] = useState(null);
  const [selectedFixtureId, setSelectedFixtureId] = useState(null);
  const [activeTool, setActiveTool] = useState('paint');
  const [paintColor, setPaintColor] = useState('#FF0088');
  const [isDragging, setIsDragging] = useState(false);
  const [dragInfo, setDragInfo] = useState(null);
  const [resolution, setResolution] = useState('4k');

  const RESOLUTIONS = {
    '1080p': { w: 1920, h: 1080, label: '1080p' },
    '4k':    { w: 3840, h: 2160, label: '4K' },
  };
  const canvasSize = RESOLUTIONS[resolution] ?? RESOLUTIONS['4k'];

  const { data: scenes = [] } = useQuery({
    queryKey: ['scenes'],
    queryFn: () => base44.entities.Scene.list('-updated_date', 50),
  });

  const { data: fixtures = [] } = useQuery({
    queryKey: ['fixtures'],
    queryFn: () => base44.entities.Fixture.list(),
  });

  // Auto-select first scene
  useEffect(() => {
    if (scenes.length > 0 && !activeScene) {
      setActiveScene(scenes[0]);
    }
  }, [scenes]);

  // Keep activeScene in sync with server data
  useEffect(() => {
    if (activeScene) {
      const updated = scenes.find(s => s.id === activeScene.id);
      if (updated) setActiveScene(updated);
    }
  }, [scenes]);

  const saveScene = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Scene.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scenes'] }),
  });

  const createScene = useMutation({
    mutationFn: (data) => base44.entities.Scene.create(data),
    onSuccess: (s) => { qc.invalidateQueries({ queryKey: ['scenes'] }); setActiveScene(s); },
  });

  const deleteScene = useMutation({
    mutationFn: (id) => base44.entities.Scene.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scenes'] });
      setActiveScene(null);
    },
  });

  const updatePlacedFixtures = useCallback((newFixtures) => {
    if (!activeScene) return;
    const updated = { ...activeScene, placed_fixtures: newFixtures };
    setActiveScene(updated);
    saveScene.mutate({ id: activeScene.id, data: { placed_fixtures: newFixtures } });
  }, [activeScene, saveScene]);

  const handleAddFixtureToCanvas = (fixture) => {
    if (!activeScene) return;
    const existing = activeScene.placed_fixtures ?? [];
    const total = fixture.type === 'panel'
      ? (fixture.rows ?? 8) * (fixture.cols ?? 8)
      : (fixture.pixel_count ?? 30);

    const placed = {
      id: nanoid(),
      fixture_id: fixture.id,
      fixture_name: fixture.name,
      fixture_type: fixture.type,
      x: 40 + Math.random() * 100,
      y: 40 + Math.random() * 100,
      pixel_count: fixture.pixel_count ?? 30,
      rows: fixture.rows ?? 1,
      cols: fixture.cols ?? fixture.pixel_count ?? 30,
      orientation: 'horizontal',
      pixel_colors: Array(total).fill('#111111'),
    };
    updatePlacedFixtures([...existing, placed]);
  };

  const handlePixelPaint = (fixtureId, pixelIdx, color) => {
    if (!activeScene) return;
    const paintC = activeTool === 'erase' ? '#111111' : color;
    const updated = (activeScene.placed_fixtures ?? []).map(f => {
      if (f.id !== fixtureId) return f;
      const colors = [...(f.pixel_colors ?? [])];
      colors[pixelIdx] = paintC;
      return { ...f, pixel_colors: colors };
    });
    updatePlacedFixtures(updated);
  };

  const handleClearAll = () => {
    if (!activeScene) return;
    const updated = (activeScene.placed_fixtures ?? []).map(f => ({
      ...f,
      pixel_colors: Array(f.pixel_colors?.length ?? 0).fill('#111111'),
    }));
    updatePlacedFixtures(updated);
  };

  const handleRemoveFixture = (id) => {
    if (!activeScene) return;
    updatePlacedFixtures((activeScene.placed_fixtures ?? []).filter(f => f.id !== id));
    setSelectedFixtureId(null);
  };

  // Drag logic
  const handleDragStart = (e, fixtureId) => {
    e.preventDefault();
    const fixture = (activeScene?.placed_fixtures ?? []).find(f => f.id === fixtureId);
    if (!fixture) return;
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    setIsDragging(true);
    setDragInfo({
      fixtureId,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startFixtureX: fixture.x,
      startFixtureY: fixture.y,
      canvasLeft: canvasRect?.left ?? 0,
      canvasTop: canvasRect?.top ?? 0,
    });
  };

  useEffect(() => {
    if (!isDragging || !dragInfo) return;

    const onMove = (e) => {
      const dx = e.clientX - dragInfo.startMouseX;
      const dy = e.clientY - dragInfo.startMouseY;
      const newX = Math.max(0, dragInfo.startFixtureX + dx);
      const newY = Math.max(0, dragInfo.startFixtureY + dy);

      setActiveScene(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          placed_fixtures: (prev.placed_fixtures ?? []).map(f =>
            f.id === dragInfo.fixtureId ? { ...f, x: newX, y: newY } : f
          ),
        };
      });
    };

    const onUp = () => {
      setIsDragging(false);
      if (activeScene) {
        saveScene.mutate({ id: activeScene.id, data: { placed_fixtures: activeScene.placed_fixtures } });
      }
      setDragInfo(null);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, dragInfo]);

  const placedFixtures = activeScene?.placed_fixtures ?? [];

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      {/* Left sidebar */}
      <div className="w-56 shrink-0 border-r border-border bg-card flex flex-col overflow-hidden">
        <div className="p-3 border-b border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Add Fixture</p>
          <FixturePicker fixtures={fixtures} onAdd={handleAddFixtureToCanvas} />
        </div>
        <div className="p-3 flex-1 overflow-hidden flex flex-col">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Paint Color</p>
          <ColorPicker color={paintColor} onChange={setPaintColor} />
        </div>
      </div>

      {/* Canvas area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-card shrink-0">
          <SceneSelector
            scenes={scenes}
            activeScene={activeScene}
            onSelect={setActiveScene}
            onCreate={(name) => createScene.mutate({ name, placed_fixtures: [] })}
            onDelete={(id) => deleteScene.mutate(id)}
          />
          <Separator orientation="vertical" className="h-5 bg-border" />
          <CanvasToolbar
            activeTool={activeTool}
            onToolChange={setActiveTool}
            onClearAll={handleClearAll}
          />
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-1 border border-border rounded-md overflow-hidden text-xs font-mono">
              {Object.entries(RESOLUTIONS).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setResolution(key)}
                  className={`px-2 py-1 transition-colors ${resolution === key ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
                >
                  {val.label}
                </button>
              ))}
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {placedFixtures.length} fixture{placedFixtures.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Canvas */}
        <div
          ref={canvasRef}
          className="flex-1 overflow-auto relative"
          style={{ background: 'hsl(220 25% 4%)' }}
          onClick={() => setSelectedFixtureId(null)}
        >
          {/* Grid overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(to right, hsl(220 20% 10% / 0.4) 1px, transparent 1px),
                linear-gradient(to bottom, hsl(220 20% 10% / 0.4) 1px, transparent 1px)
              `,
              backgroundSize: '32px 32px',
            }}
          />

          {!activeScene ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-2">
                <p className="text-muted-foreground text-sm">No scene selected</p>
                <p className="text-xs text-muted-foreground/60">Create a scene using the selector above</p>
              </div>
            </div>
          ) : placedFixtures.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center space-y-2 opacity-40">
                <p className="text-muted-foreground text-sm">Canvas is empty</p>
                <p className="text-xs text-muted-foreground/60">Add fixtures from the left panel</p>
              </div>
            </div>
          ) : null}

          {/* Placed fixtures */}
          <div className="relative" style={{ width: canvasSize.w, height: canvasSize.h }}>
            {placedFixtures.map(f => (
              <PlacedFixture
                key={f.id}
                fixture={f}
                isSelected={selectedFixtureId === f.id}
                paintColor={paintColor}
                paintMode={activeTool === 'paint' || activeTool === 'erase'}
                onSelect={setSelectedFixtureId}
                onRemove={handleRemoveFixture}
                onPixelPaint={handlePixelPaint}
                onDragStart={handleDragStart}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}