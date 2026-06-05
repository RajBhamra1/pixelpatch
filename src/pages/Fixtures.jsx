import { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import FixtureCard from '@/components/fixtures/FixtureCard';
import AddFixtureModal from '@/components/fixtures/AddFixtureModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Layers, Search } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const BRANDS = ['All', 'ROE Visual', 'Absen', 'Aluvision', 'Custom'];

export default function Fixtures() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('All');

  const { data: fixtures = [], isLoading } = useQuery({
    queryKey: ['fixtures'],
    queryFn: () => base44.entities.Fixture.list(),
  });

  const addFixture = useMutation({
    mutationFn: (data) => base44.entities.Fixture.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fixtures'] }),
  });

  const deleteFixture = useMutation({
    mutationFn: (id) => base44.entities.Fixture.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fixtures'] }),
  });

  const filtered = useMemo(() => {
    return fixtures.filter(f => {
      const matchBrand = brandFilter === 'All' || (f.brand ?? 'Custom') === brandFilter;
      const q = search.toLowerCase();
      const matchSearch = !q ||
        f.name?.toLowerCase().includes(q) ||
        f.model?.toLowerCase().includes(q) ||
        f.brand?.toLowerCase().includes(q) ||
        f.description?.toLowerCase().includes(q);
      return matchBrand && matchSearch;
    });
  }, [fixtures, brandFilter, search]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-foreground tracking-tight">Fixture Library</h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">{fixtures.length} fixtures</p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="gap-2 bg-primary hover:bg-primary/80 text-primary-foreground h-8 text-sm"
        >
          <Plus className="w-4 h-4" /> Add Custom Fixture
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-border bg-card/50 shrink-0">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search fixtures, models..."
            className="pl-8 h-8 bg-muted border-border text-sm font-mono"
          />
        </div>
        <Tabs value={brandFilter} onValueChange={setBrandFilter}>
          <TabsList className="bg-muted h-8">
            {BRANDS.map(b => (
              <TabsTrigger key={b} value={b} className="text-xs px-3 h-7 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                {b}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Layers className="w-8 h-8 text-primary/60" />
            </div>
            <div>
              <p className="text-foreground font-medium">No fixtures found</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting filters or add a custom fixture</p>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl space-y-2">
            {filtered.map(f => (
              <FixtureCard
                key={f.id}
                fixture={f}
                onDelete={(id) => deleteFixture.mutate(id)}
              />
            ))}
          </div>
        )}
      </div>

      <AddFixtureModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={(data) => addFixture.mutate(data)}
      />
    </div>
  );
}