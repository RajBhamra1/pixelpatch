import { useState } from 'react';
import { Plus, ChevronDown, Check, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function SceneSelector({ scenes, activeScene, onSelect, onCreate, onDelete }) {
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = () => {
    if (!newName.trim()) return;
    onCreate(newName.trim());
    setNewName('');
    setCreating(false);
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 border-border bg-card text-foreground h-8 text-sm font-mono">
            {activeScene?.name ?? 'Select Scene'}
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="bg-card border-border min-w-44">
          {scenes.map(s => (
            <DropdownMenuItem
              key={s.id}
              className="flex items-center justify-between gap-2 cursor-pointer"
              onClick={() => onSelect(s)}
            >
              <span className="font-mono text-sm">{s.name}</span>
              <div className="flex items-center gap-1">
                {activeScene?.id === s.id && <Check className="w-3.5 h-3.5 text-primary" />}
                <button
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </DropdownMenuItem>
          ))}
          {scenes.length > 0 && <DropdownMenuSeparator className="bg-border" />}
          <DropdownMenuItem
            className="text-primary cursor-pointer"
            onClick={() => setCreating(true)}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" /> New Scene
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {creating && (
        <div className="flex items-center gap-1">
          <Input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreating(false); }}
            placeholder="Scene name..."
            className="h-8 w-36 bg-muted border-border text-sm font-mono"
          />
          <Button size="sm" className="h-8 px-2" onClick={handleCreate}>
            <Check className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}