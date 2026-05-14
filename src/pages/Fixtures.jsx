import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import FixtureCard from '@/components/fixtures/FixtureCard';
import AddFixtureModal from '@/components/fixtures/AddFixtureModal';
import { Button } from '@/components/ui/button';
import { Plus, Layers } from 'lucide-react';

export default function Fixtures() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);

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

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-foreground tracking-tight">Fixture Library</h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">{fixtures.length} fixture{fixtures.length !== 1 ? 's' : ''}</p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="gap-2 bg-primary hover:bg-primary/80 text-primary-foreground h-8 text-sm"
        >
          <Plus className="w-4 h-4" /> Add Fixture
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : fixtures.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Layers className="w-8 h-8 text-primary/60" />
            </div>
            <div>
              <p className="text-foreground font-medium">No fixtures yet</p>
              <p className="text-sm text-muted-foreground mt-1">Add strips or panels to your library</p>
            </div>
            <Button onClick={() => setModalOpen(true)} className="gap-2 bg-primary hover:bg-primary/80 text-primary-foreground">
              <Plus className="w-4 h-4" /> Add your first fixture
            </Button>
          </div>
        ) : (
          <div className="max-w-xl space-y-2">
            {fixtures.map(f => (
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