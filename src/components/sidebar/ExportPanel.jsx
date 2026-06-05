import { useState, useRef } from 'react';
import { useProject } from '@/store/projectStore';
import SidebarPanel from './SidebarPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Upload, FileJson } from 'lucide-react';

const inputCls = 'h-7 text-xs bg-secondary border-border text-foreground';

export default function ExportPanel() {
  const { project, setProjectName, importJSON, exportJSON, stageRef } = useProject();
  const [name, setName] = useState(project.name || 'Untitled Project');
  const fileRef = useRef(null);

  const fileSafe = (s) => s.replace(/[\/\:*?"<>|]/g, '-').trim();
  const stamp = () => {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}`;
  };
  const buildFilename = (ext) =>
    `${fileSafe(project.name || 'Project')}_${project.canvas.widthPx}x${project.canvas.heightPx}_${stamp()}.${ext}`;

  const triggerDownload = (data, filename) => {
    const a = document.createElement('a');
    if (typeof data === 'string') a.href = data;
    else { a.href = URL.createObjectURL(data); setTimeout(() => URL.revokeObjectURL(a.href), 15000); }
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const commitName = () => {
    const trimmed = name.trim() || 'Untitled Project';
    if (trimmed !== project.name) setProjectName(trimmed);
  };

  const onExportPNG = () => {
    const stage = stageRef?.current;
    if (!stage) return alert('Stage not ready');
    const W = project.canvas.widthPx;
    const H = project.canvas.heightPx;
    try {
      const dataURL = stage.toDataURL({ pixelRatio: 1, x: 0, y: 0, width: W, height: H, mimeType: 'image/png' });
      triggerDownload(dataURL, buildFilename('png'));
    } catch (err) { alert(`PNG export failed: ${err.message}`); }
  };

  const onDownloadJSON = () => {
    const dump = exportJSON();
    triggerDownload(new Blob([dump], { type: 'application/json' }), buildFilename('json'));
  };

  const onImportJSON = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try { importJSON(reader.result); }
      catch { alert('Invalid project JSON'); }
    };
    reader.readAsText(f);
    e.target.value = '';
  };

  return (
    <SidebarPanel title="Export / Import">
      <div>
        <p className="text-xs text-muted-foreground mb-1">Project Name</p>
        <Input
          className={inputCls} value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
        />
      </div>

      <div className="space-y-1.5 pt-1">
        <Button variant="outline" size="sm" className="w-full h-7 text-xs justify-start gap-2" onClick={onExportPNG}>
          <Download className="w-3 h-3" /> Export PNG
        </Button>
        <Button variant="outline" size="sm" className="w-full h-7 text-xs justify-start gap-2" onClick={onDownloadJSON}>
          <FileJson className="w-3 h-3" /> Download JSON
        </Button>
        <Button variant="outline" size="sm" className="w-full h-7 text-xs justify-start gap-2" onClick={() => fileRef.current?.click()}>
          <Upload className="w-3 h-3" /> Import JSON
        </Button>
        <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={onImportJSON} />
      </div>

      <p className="text-xs text-muted-foreground font-mono pt-1">
        {project.canvas.widthPx}×{project.canvas.heightPx}px · {project.modules.length} modules · {project.groups.length} groups
      </p>
    </SidebarPanel>
  );
}