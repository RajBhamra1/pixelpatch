import { useState, useEffect, useMemo } from 'react';
import { useProject } from '@/store/projectStore';
import SidebarPanel from './SidebarPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronRight, ChevronDown } from 'lucide-react';

const inputCls = 'h-7 text-xs bg-secondary border-border text-foreground';

function ensureGradient(g) {
  const mode = g?.gradient?.mode === '2' || g?.gradient?.mode === 2 ? '2'
    : g?.gradient?.mode === '4' || g?.gradient?.mode === 4 ? '4' : '1';
  if (mode === '1') return { mode, color: g?.gradient?.color || g?.color || '#4a90e2' };
  if (mode === '2') {
    const colors = Array.isArray(g?.gradient?.colors) ? g.gradient.colors : [g?.color || '#4a90e2', '#ffffff'];
    return { mode, colors: [colors[0] || '#4a90e2', colors[1] || '#ffffff'], direction: g?.gradient?.direction || 'horizontal' };
  }
  const colors4 = Array.isArray(g?.gradient?.colors) && g.gradient.colors.length === 4 ? g.gradient.colors
    : [g?.color || '#2b2b2b', '#4b4b4b', '#6b6b6b', '#8b8b8b'];
  return { mode, colors: colors4 };
}

const randHex = () => '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');

export default function GroupsPanel() {
  const { project, selection, createGroupFromSelection, ungroupGroup, updateGroup, setSelection } = useProject();
  const [collapsed, setCollapsed] = useState({});

  useEffect(() => {
    setCollapsed((prev) => {
      const next = { ...prev };
      const ids = new Set(project.groups.map((g) => g.id));
      project.groups.forEach((g) => { if (next[g.id] === undefined) next[g.id] = true; });
      Object.keys(next).forEach((id) => { if (!ids.has(id)) delete next[id]; });
      return next;
    });
  }, [project.groups]);

  const groupsWithBounds = useMemo(() => {
    return project.groups.map((g) => {
      const rects = [];
      g.memberIds.forEach((id) => {
        const m = project.modules.find((mm) => mm.id === id);
        if (!m) return;
        const t = project.moduleTypes.find((tt) => tt.id === m.typeId);
        if (!t) return;
        rects.push({ x: m.x, y: m.y, w: t.widthPx, h: t.heightPx });
      });
      if (!rects.length) return { g, bbox: null };
      const minX = Math.min(...rects.map((r) => r.x));
      const minY = Math.min(...rects.map((r) => r.y));
      const maxX = Math.max(...rects.map((r) => r.x + r.w));
      const maxY = Math.max(...rects.map((r) => r.y + r.h));
      return { g, bbox: { x: minX, y: minY, w: maxX - minX, h: maxY - minY } };
    });
  }, [project.groups, project.modules, project.moduleTypes]);

  const stopKey = (e) => e.stopPropagation();

  return (
    <SidebarPanel title="Groups">
      <Button
        size="sm" className="w-full h-7 text-xs"
        disabled={selection.ids.length < 2}
        onClick={() => createGroupFromSelection()}
      >
        Group Selection ({selection.ids.length} selected)
      </Button>

      <div className="space-y-1 mt-1">
        {groupsWithBounds.map(({ g, bbox }) => {
          const grad = ensureGradient(g);
          const isCollapsed = !!collapsed[g.id];
          return (
            <div key={g.id} className="rounded-md border border-border bg-secondary/30 overflow-hidden">
              <div className="flex items-center gap-1 px-2 py-1.5">
                <button onClick={() => setCollapsed((c) => ({ ...c, [g.id]: !c[g.id] }))} className="text-muted-foreground hover:text-foreground">
                  {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: g.color }} />
                <span className="text-xs font-medium flex-1 truncate">{g.name}</span>
                <button className="text-xs text-primary hover:underline" onClick={() => setSelection([...g.memberIds])}>sel</button>
                <button className="text-xs text-destructive hover:underline ml-1" onClick={() => ungroupGroup(g.id)}>del</button>
              </div>
              {bbox && (
                <div className="px-2 pb-1 text-xs text-muted-foreground font-mono">
                  {bbox.w}×{bbox.h}px @ ({bbox.x},{bbox.y})
                </div>
              )}
              {!isCollapsed && (
                <div className="px-2 pb-2 space-y-1.5 border-t border-border pt-2">
                  <Input className={inputCls} value={g.name} onKeyDown={stopKey}
                    onChange={(e) => updateGroup(g.id, { name: e.target.value })} placeholder="Group name" />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-20">Border</span>
                    <input type="color" value={g.color || '#4a90e2'} onKeyDown={stopKey}
                      onChange={(e) => updateGroup(g.id, { color: e.target.value })}
                      className="w-7 h-7 rounded cursor-pointer" />
                    <Input className={`${inputCls} w-14`} type="number" value={g.borderWidth || 2} onKeyDown={stopKey}
                      onChange={(e) => updateGroup(g.id, { borderWidth: parseInt(e.target.value, 10) })} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-20">Fill mode</span>
                    <select
                      value={grad.mode}
                      onKeyDown={stopKey}
                      onChange={(e) => {
                        const mode = e.target.value;
                        if (mode === '1') updateGroup(g.id, { gradient: { mode: '1', color: grad.color || g.color } });
                        else if (mode === '2') updateGroup(g.id, { gradient: { mode: '2', colors: [g.color || '#4a90e2', '#ffffff'], direction: 'horizontal' } });
                        else updateGroup(g.id, { gradient: { mode: '4', colors: [g.color || '#2b2b2b', '#4b4b4b', '#6b6b6b', '#8b8b8b'] } });
                      }}
                      className="h-7 text-xs rounded-md border border-border bg-secondary text-foreground px-1 flex-1"
                    >
                      <option value="1">Solid</option>
                      <option value="2">2-color</option>
                      <option value="4">4-corner</option>
                    </select>
                    <button onClick={() => {
                      if (grad.mode === '1') updateGroup(g.id, { gradient: { mode: '1', color: randHex() } });
                      else if (grad.mode === '2') updateGroup(g.id, { gradient: { mode: '2', colors: [randHex(), randHex()], direction: grad.direction || 'horizontal' } });
                      else updateGroup(g.id, { gradient: { mode: '4', colors: [randHex(), randHex(), randHex(), randHex()] } });
                    }} className="text-xs text-primary hover:underline">rand</button>
                  </div>
                  {grad.mode === '1' && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-20">Color</span>
                      <input type="color" value={grad.color || '#4a90e2'} onKeyDown={stopKey}
                        onChange={(e) => updateGroup(g.id, { gradient: { mode: '1', color: e.target.value } })}
                        className="w-7 h-7 rounded cursor-pointer" />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </SidebarPanel>
  );
}