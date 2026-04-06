import { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { BookOpen, Plus, Trash2, Edit3, Check, X, ChevronDown, ChevronRight, Link2, FileText, Square, CheckSquare, Bell, BellOff } from 'lucide-react';

interface SubTask {
  id: string;
  text: string;
  done: boolean;
}

interface MaterialLink {
  id: string;
  url: string;
  title: string;
}

interface MaterialFile {
  id: string;
  name: string;
  data: string; // base64
}

interface Subject {
  id: string;
  name: string;
  done: number;
  total: number;
  subtasks: SubTask[];
  links: MaterialLink[];
  files: MaterialFile[];
  reminderTime?: string; // HH:mm
  reminderEnabled?: boolean;
}

const CircularProgress = ({ percent, size = 40 }: { percent: number; size?: number }) => {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(0 0% 15%)" strokeWidth="3" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(0 72% 51%)" strokeWidth="3"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        className="transition-all duration-500" style={{ filter: 'drop-shadow(0 0 4px hsl(0 72% 51% / 0.5))' }} />
    </svg>
  );
};

const getFavicon = (url: string) => {
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=16`;
  } catch { return null; }
};

const IntelligenceModule = () => {
  const [subjects, setSubjects] = useLocalStorage<Subject[]>('ramzes-subjects', []);
  const [newName, setNewName] = useState('');
  const [newTotal, setNewTotal] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newSubtask, setNewSubtask] = useState('');
  const [newLink, setNewLink] = useState('');

  const updateSubject = (id: string, fn: (s: Subject) => Subject) => {
    setSubjects(prev => prev.map(s => s.id === id ? fn(s) : s));
  };

  const addSubject = () => {
    if (!newName.trim() || subjects.length >= 15) return;
    setSubjects(prev => [...prev, {
      id: crypto.randomUUID(), name: newName.trim(), done: 0,
      total: Number(newTotal) || 10, subtasks: [], links: [], files: [],
    }]);
    setNewName(''); setNewTotal('');
  };

  const increment = (id: string) => updateSubject(id, s => ({ ...s, done: Math.min(s.done + 1, s.total) }));
  const decrement = (id: string) => updateSubject(id, s => ({ ...s, done: Math.max(0, s.done - 1) }));
  const remove = (id: string) => { setSubjects(prev => prev.filter(s => s.id !== id)); if (expandedId === id) setExpandedId(null); };

  const addSubtask = (id: string) => {
    if (!newSubtask.trim()) return;
    updateSubject(id, s => ({ ...s, subtasks: [...s.subtasks, { id: crypto.randomUUID(), text: newSubtask.trim(), done: false }] }));
    setNewSubtask('');
  };

  const toggleSubtask = (subjectId: string, taskId: string) => {
    updateSubject(subjectId, s => ({ ...s, subtasks: s.subtasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t) }));
  };

  const removeSubtask = (subjectId: string, taskId: string) => {
    updateSubject(subjectId, s => ({ ...s, subtasks: s.subtasks.filter(t => t.id !== taskId) }));
  };

  const addLink = (id: string) => {
    if (!newLink.trim()) return;
    const url = newLink.startsWith('http') ? newLink : `https://${newLink}`;
    updateSubject(id, s => ({ ...s, links: [...s.links, { id: crypto.randomUUID(), url, title: url }] }));
    setNewLink('');
  };

  const removeLink = (subjectId: string, linkId: string) => {
    updateSubject(subjectId, s => ({ ...s, links: s.links.filter(l => l.id !== linkId) }));
  };

  const handleFileUpload = (subjectId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.name.endsWith('.pdf')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      updateSubject(subjectId, s => ({
        ...s, files: [...s.files, { id: crypto.randomUUID(), name: file.name, data: base64 }]
      }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeFile = (subjectId: string, fileId: string) => {
    updateSubject(subjectId, s => ({ ...s, files: s.files.filter(f => f.id !== fileId) }));
  };

  return (
    <div className="glass-panel rounded-lg p-4 glow-border glow-border-hover transition-all duration-300 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-primary" />
        <h2 className="font-display text-lg text-primary">Интеллектуальное Ядро</h2>
        <span className="text-xs text-muted-foreground ml-auto">{subjects.length}/15</span>
      </div>

      {/* Add */}
      <div className="flex gap-2 mb-3">
        <input placeholder="Дисциплина" value={newName} onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addSubject()}
          className="bg-input border border-border rounded px-2 py-1.5 text-foreground text-sm flex-1 min-w-0" />
        <input type="number" placeholder="Всего" value={newTotal} onChange={e => setNewTotal(e.target.value)}
          className="bg-input border border-border rounded px-2 py-1.5 text-foreground text-sm w-16" />
        <button onClick={addSubject} disabled={subjects.length >= 15}
          className="bg-primary text-primary-foreground p-1.5 rounded hover:shadow-[var(--glow-md)] transition-shadow disabled:opacity-30">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Subjects */}
      <div className="flex-1 overflow-y-auto space-y-2 min-h-0 content-start">
        {subjects.map(s => {
          const pct = s.total > 0 ? (s.done / s.total) * 100 : 0;
          const isExpanded = expandedId === s.id;
          return (
            <div key={s.id} className="bg-muted/30 rounded-md overflow-hidden transition-colors">
              {/* Header */}
              <div className="flex items-center gap-3 px-3 py-2 group hover:bg-muted/50 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : s.id)}>
                {isExpanded ? <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" /> : <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />}
                <CircularProgress percent={pct} size={36} />
                <div className="flex-1 min-w-0">
                  {editId === s.id ? (
                    <div className="flex gap-1 items-center" onClick={e => e.stopPropagation()}>
                      <input value={editName} onChange={e => setEditName(e.target.value)}
                        className="bg-input border border-border rounded px-1 py-0.5 text-foreground text-sm flex-1 min-w-0" />
                      <button onClick={() => { updateSubject(s.id, sub => ({ ...sub, name: editName })); setEditId(null); }}>
                        <Check className="w-3 h-3 text-primary" />
                      </button>
                      <button onClick={() => setEditId(null)}><X className="w-3 h-3 text-muted-foreground" /></button>
                    </div>
                  ) : (
                    <span className="text-sm text-foreground truncate block">{s.name}</span>
                  )}
                  <span className="text-xs text-muted-foreground">{s.done}/{s.total} ({pct.toFixed(0)}%)</span>
                </div>
                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                  <button onClick={() => decrement(s.id)} className="text-muted-foreground hover:text-foreground text-lg px-1">−</button>
                  <button onClick={() => increment(s.id)} className="text-primary hover:text-primary/80 text-lg px-1 font-bold">+</button>
                  <button onClick={() => { setEditId(s.id); setEditName(s.name); }} className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Edit3 className="w-3 h-3 text-muted-foreground" />
                  </button>
                  <button onClick={() => remove(s.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-3 h-3 text-muted-foreground hover:text-primary" />
                  </button>
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-3 pb-3 space-y-3 border-t border-border/50 pt-2 animate-fade-in">
                  {/* Subtasks */}
                  <div>
                    <div className="text-xs text-muted-foreground uppercase mb-1">Подзадачи</div>
                    <div className="space-y-1 mb-1">
                      {s.subtasks.map(t => (
                        <div key={t.id} className="flex items-center gap-2 text-xs group/st">
                          <button onClick={() => toggleSubtask(s.id, t.id)}>
                            {t.done ? <CheckSquare className="w-3.5 h-3.5 text-primary" /> : <Square className="w-3.5 h-3.5 text-muted-foreground" />}
                          </button>
                          <span className={`flex-1 ${t.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{t.text}</span>
                          <button onClick={() => removeSubtask(s.id, t.id)} className="opacity-0 group-hover/st:opacity-100">
                            <X className="w-3 h-3 text-muted-foreground" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-1">
                      <input placeholder="Новая подзадача" value={expandedId === s.id ? newSubtask : ''} onChange={e => setNewSubtask(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addSubtask(s.id)}
                        className="bg-input border border-border rounded px-2 py-1 text-foreground text-xs flex-1" />
                      <button onClick={() => addSubtask(s.id)} className="bg-primary/20 text-primary p-1 rounded">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Materials */}
                  <div>
                    <div className="text-xs text-muted-foreground uppercase mb-1">Материалы</div>
                    {/* Links */}
                    <div className="space-y-1 mb-1">
                      {s.links.map(l => (
                        <div key={l.id} className="flex items-center gap-2 text-xs group/lk">
                          {getFavicon(l.url) && <img src={getFavicon(l.url)!} className="w-3 h-3" alt="" />}
                          <a href={l.url} target="_blank" rel="noopener" className="text-primary truncate hover:underline flex-1">{l.url}</a>
                          <button onClick={() => removeLink(s.id, l.id)} className="opacity-0 group-hover/lk:opacity-100">
                            <X className="w-3 h-3 text-muted-foreground" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-1 mb-2">
                      <div className="relative flex-1">
                        <Link2 className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                        <input placeholder="Вставить ссылку" value={expandedId === s.id ? newLink : ''} onChange={e => setNewLink(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && addLink(s.id)}
                          className="bg-input border border-border rounded pl-6 pr-2 py-1 text-foreground text-xs w-full" />
                      </div>
                      <button onClick={() => addLink(s.id)} className="bg-primary/20 text-primary p-1 rounded">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Files */}
                    <div className="space-y-1 mb-1">
                      {s.files.map(f => (
                        <div key={f.id} className="flex items-center gap-2 text-xs group/fl">
                          <FileText className="w-3 h-3 text-primary shrink-0" />
                          <a href={f.data} download={f.name} className="text-foreground truncate hover:text-primary flex-1">{f.name}</a>
                          <button onClick={() => removeFile(s.id, f.id)} className="opacity-0 group-hover/fl:opacity-100">
                            <X className="w-3 h-3 text-muted-foreground" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                      <FileText className="w-3 h-3" />
                      <span>Загрузить PDF</span>
                      <input type="file" accept=".pdf" className="hidden" onChange={e => handleFileUpload(s.id, e)} />
                    </label>
                  </div>

                  {/* Reminder */}
                  <div>
                    <div className="text-xs text-muted-foreground uppercase mb-1">Напоминание</div>
                    <div className="flex items-center gap-2">
                      <input type="time" value={s.reminderTime || ''}
                        onChange={e => updateSubject(s.id, sub => ({ ...sub, reminderTime: e.target.value, reminderEnabled: true }))}
                        className="bg-input border border-border rounded px-2 py-1 text-foreground text-xs" />
                      <button onClick={() => updateSubject(s.id, sub => ({ ...sub, reminderEnabled: !sub.reminderEnabled }))}
                        className={`p-1 rounded transition-colors ${s.reminderEnabled ? 'text-primary bg-primary/20' : 'text-muted-foreground'}`}
                        title={s.reminderEnabled ? 'Выключить' : 'Включить'}>
                        {s.reminderEnabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                      </button>
                      {s.reminderTime && s.reminderEnabled && (
                        <span className="text-xs text-primary">⏰ {s.reminderTime}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {subjects.length === 0 && (
          <div className="text-center text-muted-foreground text-xs py-8">Добавьте дисциплины для отслеживания</div>
        )}
      </div>
    </div>
  );
};

export default IntelligenceModule;