import { useState } from 'react';
import { useProject, PANELS_LIBRARY } from '@/store/projectStore';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import SidebarPanel from './SidebarPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';

const inputCls = 'h-7 text-xs bg-secondary border-border text-foreground';
const labelCls = 'text-xs text-muted-foreground mb-1';

export default function ModulesPanel() {
  const { project, setActiveType, addModuleType, activeType, updateCanvas } = useProject();
  const [name, setName] = useState('');
  const [width, setWidth] = useState('500');
  const [height, setHeight] = useState('500');

  const { data: dbFixtures = [] } = useQuery({
    queryKey: ['fixtures'],
    queryFn: () => base44.entities.Fixture.list(),
  });

  // Merge DB fixtures into library format
  const dbItems = dbFixtures.map((f) => {
    const isPanel = f.type === 'panel';
    const widthPx = isPanel ? (f.cols ?? 8) : (f.pixel_count ?? 30);
    const heightPx = isPanel ? (f.rows ?? 8) : 1;
    return {
      brand: f.brand || 'Custom',
      model: f.name,
      widthPx,
      heightPx,
      _id: f.id,
    };
  });

  // Built-in library brands + DB group
  const builtInBrands = [...new Set(PANELS_LIBRARY.map((i) => i.brand))];

  const addType = () => {
    const w = parseInt(width, 10);
    const h = parseInt(height, 10);
    if (!name.trim() || isNaN(w) || isNaN(h)) return;
    const id = addModuleType(name.trim(), w, h);
    setActiveType(id);
    setName(''); setWidth('500'); setHeight('500');
  };

  const addFromLibrary = (key) => {
    if (!key) return;
    // Try built-in first
    const builtIn = PANELS_LIBRARY.find((i) => `builtin::${i.brand}::${i.model}` === key);
    if (builtIn) {
      const id = addModuleType(`${builtIn.brand} ${builtIn.model}`, builtIn.widthPx, builtIn.heightPx);
      setActiveType(id);
      return;
    }
    // Try DB fixture
    const db = dbItems.find((i) => `db::${i._id}` === key);
    if (db) {
      const id = addModuleType(`${db.brand} ${db.model}`, db.widthPx, db.heightPx);
      setActiveType(id);
    }
  };

  return (
    <SidebarPanel title="Modules" defaultOpen={true}>
      {activeType && (
        <p className="text-xs text-accent bg-accent/10 border border-accent/30 rounded px-2 py-1">
          ✦ Drag on canvas to place a grid · Click to place one
        </p>
      )}
      <div>
        <p className={labelCls}>Active Type</p>
        <select
          value={activeType || ''}
          onChange={(e) => setActiveType(e.target.value || null)}
          className="w-full h-7 text-xs rounded-md border border-border bg-secondary text-foreground px-2"
        >
          <option value="">— Select module type —</option>
          {project.moduleTypes.map((t) => (
            <option key={t.id} value={t.id}>{t.name} ({t.widthPx}×{t.heightPx})</option>
          ))}
        </select>
      </div>

      <div>
        <p className={labelCls}>Add from LED Library</p>
        <select
          defaultValue=""
          onChange={(e) => { addFromLibrary(e.target.value); e.target.value = ''; }}
          className="w-full h-7 text-xs rounded-md border border-border bg-secondary text-foreground px-2"
        >
          <option value="">— Add panel from library —</option>
          {builtInBrands.map((brand) => (
            <optgroup key={brand} label={brand}>
              {PANELS_LIBRARY.filter((i) => i.brand === brand).map((i) => (
                <option key={`builtin::${i.brand}::${i.model}`} value={`builtin::${i.brand}::${i.model}`}>
                  {i.model} ({i.widthPx}×{i.heightPx})
                </option>
              ))}
            </optgroup>
          ))}
          {dbItems.length > 0 && (
            <optgroup label="My Fixtures (DB)">
              {dbItems.map((i) => (
                <option key={`db::${i._id}`} value={`db::${i._id}`}>
                  {i.brand !== 'Custom' ? `${i.brand} ` : ''}{i.model} ({i.widthPx}×{i.heightPx})
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      <div className="border-t border-border pt-2 space-y-1.5">
        <p className={labelCls}>Custom Module Type</p>
        <Input className={inputCls} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="flex gap-1">
          <Input className={inputCls} type="number" placeholder="W px" value={width} onChange={(e) => setWidth(e.target.value)} />
          <Input className={inputCls} type="number" placeholder="H px" value={height} onChange={(e) => setHeight(e.target.value)} />
        </div>
        <Button size="sm" className="w-full h-7 text-xs" onClick={addType}>
          <Plus className="w-3 h-3 mr-1" /> Add Type
        </Button>
      </div>

      <div className="border-t border-border pt-2 space-y-1.5">
        <p className={labelCls}>Label Settings</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-16">Font size</span>
          <Input
            className={`${inputCls} flex-1`} type="number"
            value={project.canvas.labelFontSize || 12}
            onChange={(e) => updateCanvas({ labelFontSize: parseInt(e.target.value, 10) || 12 })}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-16">Text color</span>
          <input type="color" value={project.canvas.labelTextColor || '#ffffff'}
            onChange={(e) => updateCanvas({ labelTextColor: e.target.value })}
            className="w-7 h-7 rounded cursor-pointer border border-border bg-transparent"
          />
        </div>
      </div>
    </SidebarPanel>
  );
}