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
  const [widthMm, setWidthMm] = useState('500');
  const [heightMm, setHeightMm] = useState('500');
  const [cols, setCols] = useState('128');
  const [rows, setRows] = useState('128');
  const [pitch, setPitch] = useState('3.9');

  const { data: dbFixtures = [] } = useQuery({
    queryKey: ['fixtures'],
    queryFn: () => base44.entities.Fixture.list(),
  });

  // Scale: 1mm ≈ 0.5px on canvas (500mm panel = 250px)
  const mmToPx = (mm) => Math.round(parseFloat(mm) * 0.5);

  const dbItems = dbFixtures
    .filter((f) => f.type === 'panel')
    .map((f) => ({
      brand: f.brand || 'Custom',
      model: f.name,
      widthPx: f.panel_width_mm ? mmToPx(f.panel_width_mm) : 250,
      heightPx: f.panel_height_mm ? mmToPx(f.panel_height_mm) : 250,
      cols: f.cols || 0,
      rows: f.rows || 0,
      pitch: f.pixel_pitch_mm || null,
      _id: f.id,
    }));

  const builtInBrands = [...new Set(PANELS_LIBRARY.map((i) => i.brand))];

  const addType = () => {
    const w = mmToPx(widthMm);
    const h = mmToPx(heightMm);
    const c = parseInt(cols, 10) || 0;
    const r = parseInt(rows, 10) || 0;
    const p = parseFloat(pitch) || null;
    if (!name.trim() || isNaN(w) || isNaN(h)) return;
    const id = addModuleType(name.trim(), w, h, c, r, p);
    setActiveType(id);
    setName('');
  };

  const addFromLibrary = (key) => {
    if (!key) return;
    const builtIn = PANELS_LIBRARY.find((i) => `builtin::${i.brand}::${i.model}` === key);
    if (builtIn) {
      const id = addModuleType(`${builtIn.brand} ${builtIn.model}`, builtIn.widthPx, builtIn.heightPx, builtIn.cols, builtIn.rows, builtIn.pitch);
      setActiveType(id);
      return;
    }
    const db = dbItems.find((i) => `db::${i._id}` === key);
    if (db) {
      const id = addModuleType(`${db.brand} ${db.model}`, db.widthPx, db.heightPx, db.cols, db.rows, db.pitch);
      setActiveType(id);
    }
  };

  // Auto-fill cols/rows when pitch + size changes
  const autoCalc = () => {
    const p = parseFloat(pitch);
    const wMm = parseFloat(widthMm);
    const hMm = parseFloat(heightMm);
    if (p > 0 && wMm > 0 && hMm > 0) {
      setCols(String(Math.round(wMm / p)));
      setRows(String(Math.round(hMm / p)));
    }
  };

  const activeTypeObj = project.moduleTypes.find((t) => t.id === activeType);

  return (
    <SidebarPanel title="Modules" defaultOpen={true}>
      {activeType && (
        <p className="text-xs text-accent bg-accent/10 border border-accent/30 rounded px-2 py-1">
          ✦ Drag on canvas to place a grid · Click to place one
        </p>
      )}

      <div>
        <p className={labelCls}>Active Panel Type</p>
        <select
          value={activeType || ''}
          onChange={(e) => setActiveType(e.target.value || null)}
          className="w-full h-7 text-xs rounded-md border border-border bg-secondary text-foreground px-2"
        >
          <option value="">— Select panel type —</option>
          {project.moduleTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}{t.cols && t.rows ? ` [${t.cols}×${t.rows}]` : ''}
            </option>
          ))}
        </select>
        {activeTypeObj && (
          <div className="mt-1 text-xs text-muted-foreground font-mono bg-secondary/50 rounded px-2 py-1 space-y-0.5">
            <div>Size: {activeTypeObj.widthPx * 2}×{activeTypeObj.heightPx * 2}mm ({activeTypeObj.widthPx}×{activeTypeObj.heightPx}px)</div>
            {activeTypeObj.cols > 0 && activeTypeObj.rows > 0 && (
              <div>Pixels: {activeTypeObj.cols}×{activeTypeObj.rows} = <span className="text-accent">{activeTypeObj.cols * activeTypeObj.rows} LEDs</span></div>
            )}
            {activeTypeObj.pitch && <div>Pitch: {activeTypeObj.pitch}mm</div>}
          </div>
        )}
      </div>

      <div>
        <p className={labelCls}>Add from Library</p>
        <select
          defaultValue=""
          onChange={(e) => { addFromLibrary(e.target.value); e.target.value = ''; }}
          className="w-full h-7 text-xs rounded-md border border-border bg-secondary text-foreground px-2"
        >
          <option value="">— Select panel from library —</option>
          {builtInBrands.map((brand) => (
            <optgroup key={brand} label={brand}>
              {PANELS_LIBRARY.filter((i) => i.brand === brand).map((i) => (
                <option key={`builtin::${i.brand}::${i.model}`} value={`builtin::${i.brand}::${i.model}`}>
                  {i.model} — {i.cols}×{i.rows} ({i.pitch}mm)
                </option>
              ))}
            </optgroup>
          ))}
          {dbItems.length > 0 && (
            <optgroup label="My Fixtures">
              {dbItems.map((i) => (
                <option key={`db::${i._id}`} value={`db::${i._id}`}>
                  {i.brand !== 'Custom' ? `${i.brand} ` : ''}{i.model}
                  {i.cols && i.rows ? ` [${i.cols}×${i.rows}]` : ''}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      <div className="border-t border-border pt-2 space-y-1.5">
        <p className={labelCls}>Custom Panel Type</p>
        <Input className={inputCls} placeholder="Name (e.g. ROE BP2)" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="grid grid-cols-2 gap-1">
          <div>
            <p className="text-[10px] text-muted-foreground mb-0.5">Width mm</p>
            <Input className={inputCls} type="number" placeholder="500" value={widthMm} onChange={(e) => setWidthMm(e.target.value)} />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground mb-0.5">Height mm</p>
            <Input className={inputCls} type="number" placeholder="500" value={heightMm} onChange={(e) => setHeightMm(e.target.value)} />
          </div>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground mb-0.5">Pixel Pitch mm</p>
          <div className="flex gap-1">
            <Input className={`${inputCls} flex-1`} type="number" step="0.1" placeholder="3.9" value={pitch} onChange={(e) => setPitch(e.target.value)} />
            <Button size="sm" variant="outline" className="h-7 text-xs px-2 shrink-0" onClick={autoCalc}>Calc</Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1">
          <div>
            <p className="text-[10px] text-muted-foreground mb-0.5">Pixel Cols</p>
            <Input className={inputCls} type="number" placeholder="128" value={cols} onChange={(e) => setCols(e.target.value)} />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground mb-0.5">Pixel Rows</p>
            <Input className={inputCls} type="number" placeholder="128" value={rows} onChange={(e) => setRows(e.target.value)} />
          </div>
        </div>
        {cols && rows && (
          <p className="text-[10px] text-accent font-mono">= {parseInt(cols)||0} × {parseInt(rows)||0} = {(parseInt(cols)||0)*(parseInt(rows)||0)} LEDs per panel</p>
        )}
        <Button size="sm" className="w-full h-7 text-xs" onClick={addType}>
          <Plus className="w-3 h-3 mr-1" /> Add Panel Type
        </Button>
      </div>

      <div className="border-t border-border pt-2 space-y-1.5">
        <p className={labelCls}>Display Settings</p>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={project.canvas.showPixelGrid ?? true}
            onChange={(e) => updateCanvas({ showPixelGrid: e.target.checked })}
            className="accent-primary"
          />
          <span className="text-xs text-foreground">Show pixel grid</span>
        </label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-20">Label size</span>
          <Input
            className={`${inputCls} flex-1`} type="number"
            value={project.canvas.labelFontSize || 11}
            onChange={(e) => updateCanvas({ labelFontSize: parseInt(e.target.value, 10) || 11 })}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-20">Label color</span>
          <input type="color" value={project.canvas.labelTextColor || '#ffffff'}
            onChange={(e) => updateCanvas({ labelTextColor: e.target.value })}
            className="w-7 h-7 rounded cursor-pointer border border-border bg-transparent"
          />
        </div>
      </div>
    </SidebarPanel>
  );
}