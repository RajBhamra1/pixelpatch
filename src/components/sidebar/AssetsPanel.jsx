import { useRef } from 'react';
import { useProject } from '@/store/projectStore';
import SidebarPanel from './SidebarPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X } from 'lucide-react';

const inputCls = 'h-7 text-xs bg-secondary border-border text-foreground';

export default function AssetsPanel() {
  const { project, setBackgroundImage, clearBackgroundImage, setLogoBox, updateCanvas } = useProject();
  const fileRef = useRef(null);

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setBackgroundImage(reader.result);
    reader.readAsDataURL(f);
    e.target.value = '';
  };

  const logo = project.canvas.logo || { x: 0, y: 0, size: 200 };

  return (
    <SidebarPanel title="Assets">
      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground">Background Image</p>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" className="flex-1 h-7 text-xs gap-1" onClick={() => fileRef.current?.click()}>
            <Upload className="w-3 h-3" /> Upload
          </Button>
          {project.canvas.background?.src && (
            <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={clearBackgroundImage}>
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />

        {project.canvas.background?.src && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Fit</p>
            <select
              value={project.canvas.background?.fit || 'contain'}
              onChange={(e) => updateCanvas({ background: { ...project.canvas.background, fit: e.target.value } })}
              className="w-full h-7 text-xs rounded-md border border-border bg-secondary text-foreground px-2"
            >
              <option value="contain">Contain</option>
              <option value="cover">Cover</option>
              <option value="stretch">Stretch</option>
            </select>
          </div>
        )}
      </div>

      <div className="border-t border-border pt-2 space-y-1.5">
        <p className="text-xs text-muted-foreground">Logo Watermark</p>
        <div className="grid grid-cols-3 gap-1">
          {['x', 'y', 'size'].map((field) => (
            <div key={field}>
              <p className="text-xs text-muted-foreground mb-0.5">{field.toUpperCase()}</p>
              <Input
                className={inputCls} type="number"
                value={logo[field] || 0}
                onChange={(e) => setLogoBox({ [field]: parseInt(e.target.value || '0', 10) })}
              />
            </div>
          ))}
        </div>
      </div>
    </SidebarPanel>
  );
}