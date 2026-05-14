import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Layers, Minus } from 'lucide-react';

export default function AddFixtureModal({ open, onClose, onAdd }) {
  const [tab, setTab] = useState('strip');
  const [name, setName] = useState('');
  const [pixelCount, setPixelCount] = useState(30);
  const [rows, setRows] = useState(8);
  const [cols, setCols] = useState(8);

  const handleAdd = () => {
    if (!name.trim()) return;
    const fixture = tab === 'strip'
      ? { name: name.trim(), type: 'strip', pixel_count: Number(pixelCount) }
      : { name: name.trim(), type: 'panel', rows: Number(rows), cols: Number(cols) };
    onAdd(fixture);
    setName('');
    setPixelCount(30);
    setRows(8);
    setCols(8);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add Fixture</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Name</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Stage Left Strip"
              className="bg-muted border-border text-foreground"
            />
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="w-full bg-muted">
              <TabsTrigger value="strip" className="flex-1 gap-1.5 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                <Minus className="w-3.5 h-3.5" /> Strip
              </TabsTrigger>
              <TabsTrigger value="panel" className="flex-1 gap-1.5 data-[state=active]:bg-neon-cyan/20 data-[state=active]:text-neon-cyan">
                <Layers className="w-3.5 h-3.5" /> Panel
              </TabsTrigger>
            </TabsList>

            <TabsContent value="strip" className="space-y-3 pt-3">
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Pixel Count</Label>
                <Input
                  type="number"
                  min={1}
                  max={1000}
                  value={pixelCount}
                  onChange={e => setPixelCount(e.target.value)}
                  className="bg-muted border-border text-foreground font-mono"
                />
              </div>
            </TabsContent>

            <TabsContent value="panel" className="space-y-3 pt-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Rows</Label>
                  <Input
                    type="number"
                    min={1}
                    max={64}
                    value={rows}
                    onChange={e => setRows(e.target.value)}
                    className="bg-muted border-border text-foreground font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Cols</Label>
                  <Input
                    type="number"
                    min={1}
                    max={64}
                    value={cols}
                    onChange={e => setCols(e.target.value)}
                    className="bg-muted border-border text-foreground font-mono"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                {rows * cols} total pixels
              </p>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1 border-border" onClick={onClose}>Cancel</Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary/80 text-primary-foreground"
              onClick={handleAdd}
              disabled={!name.trim()}
            >
              Add Fixture
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}