import { Link, useLocation, Outlet } from 'react-router-dom';
import { Zap, Grid3x3, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: 'Canvas', icon: Grid3x3 },
  { path: '/fixtures', label: 'Fixtures', icon: Layers },
];

export default function AppLayout() {
  const location = useLocation();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-16 flex flex-col items-center py-4 gap-6 border-r border-border bg-card shrink-0">
        {/* Logo */}
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/20 border border-primary/30">
          <Zap className="w-5 h-5 text-primary" />
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-2">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              title={label}
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200",
                location.pathname === path
                  ? "bg-primary/20 text-primary border border-primary/40 neon-glow-purple"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <Icon className="w-5 h-5" />
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}