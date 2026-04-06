import { useState, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Activity, Plus, Trash2, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface DataPoint {
  date: string;
  value: number;
}

interface Criterion {
  id: string;
  name: string;
  inverted: boolean; // if true, higher = worse (e.g., pain)
  data: DataPoint[];
}

const COLORS = ['#DC2626', '#ef4444', '#f87171', '#fb923c', '#facc15', '#4ade80', '#22d3ee', '#818cf8'];

const MiniChart = ({ data, label, color = '#DC2626' }: { data: DataPoint[]; label: string; color?: string }) => (
  <div>
    <div className="text-xs text-muted-foreground mb-1 uppercase">{label}</div>
    {data.length > 1 ? (
      <ResponsiveContainer width="100%" height={60}>
        <LineChart data={data.slice(-14)}>
          <XAxis dataKey="date" hide />
          <YAxis hide domain={[0, 10]} />
          <Tooltip contentStyle={{ background: 'hsl(0 0% 5%)', border: '1px solid hsl(0 0% 15%)', borderRadius: '6px', fontSize: '11px' }}
            labelStyle={{ color: 'hsl(0 0% 55%)' }} />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false}
            style={{ filter: `drop-shadow(0 0 4px ${color}80)` }} />
        </LineChart>
      </ResponsiveContainer>
    ) : (
      <div className="h-[60px] flex items-center justify-center text-muted-foreground text-xs">Нужно ≥2 точек</div>
    )}
  </div>
);

const BiometricsModule = () => {
  const [criteria, setCriteria] = useLocalStorage<Criterion[]>('ramzes-bio-criteria', [
    { id: '1', name: 'Боль (Спина)', inverted: true, data: [] },
    { id: '2', name: 'Вес', inverted: false, data: [] },
    { id: '3', name: 'Тонус и Энергия', inverted: false, data: [] },
  ]);

  const [sliderValues, setSliderValues] = useState<Record<string, number>>({});
  const [newCriterion, setNewCriterion] = useState('');
  const [newInverted, setNewInverted] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const today = new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });

  const addCriterion = () => {
    if (!newCriterion.trim()) return;
    setCriteria(prev => [...prev, {
      id: crypto.randomUUID(), name: newCriterion.trim(), inverted: newInverted, data: []
    }]);
    setNewCriterion('');
    setNewInverted(false);
  };

  const removeCriterion = (id: string) => {
    setCriteria(prev => prev.filter(c => c.id !== id));
  };

  const submitReport = () => {
    setCriteria(prev => prev.map(c => {
      const val = sliderValues[c.id];
      if (val === undefined) return c;
      return { ...c, data: [...c.data, { date: today, value: val }] };
    }));
    setSliderValues({});
    setShowReport(false);
  };

  // Total Bio Index
  const totalIndex = useMemo(() => {
    const points: Record<string, number[]> = {};
    criteria.forEach(c => {
      c.data.forEach(dp => {
        if (!points[dp.date]) points[dp.date] = [];
        const normalized = c.inverted ? (10 - dp.value) : dp.value;
        points[dp.date].push(normalized);
      });
    });
    return Object.entries(points)
      .map(([date, vals]) => ({ date, value: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [criteria]);

  return (
    <div className="glass-panel rounded-lg p-4 glow-border glow-border-hover transition-all duration-300 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-primary" />
        <h2 className="font-display text-lg text-primary">Биометрия</h2>
      </div>

      {/* Total Bio Index */}
      <div className="mb-3">
        <div className="text-xs text-muted-foreground mb-1 uppercase font-semibold">🔥 Индекс RAMZES (средневзв.)</div>
        {totalIndex.length > 1 ? (
          <ResponsiveContainer width="100%" height={70}>
            <LineChart data={totalIndex.slice(-14)}>
              <XAxis dataKey="date" hide />
              <YAxis hide domain={[0, 10]} />
              <Tooltip contentStyle={{ background: 'hsl(0 0% 5%)', border: '1px solid hsl(0 0% 15%)', borderRadius: '6px', fontSize: '11px' }}
                labelStyle={{ color: 'hsl(0 0% 55%)' }} />
              <Line type="monotone" dataKey="value" stroke="#DC2626" strokeWidth={3} dot={false}
                style={{ filter: 'drop-shadow(0 0 6px #DC262680)' }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[70px] flex items-center justify-center text-muted-foreground text-xs">Заполните вечерний отчёт для построения индекса</div>
        )}
        {totalIndex.length > 0 && (
          <div className="text-center">
            <span className="font-display text-2xl text-primary glow-text">{totalIndex[totalIndex.length - 1].value}</span>
            <span className="text-xs text-muted-foreground"> / 10</span>
          </div>
        )}
      </div>

      {/* Evening report button */}
      <button onClick={() => {
        const defaults: Record<string, number> = {};
        criteria.forEach(c => { defaults[c.id] = 5; });
        setSliderValues(defaults);
        setShowReport(true);
      }} className="w-full bg-primary/20 text-primary py-2 rounded text-sm font-semibold hover:bg-primary/30 transition-colors mb-3">
        📝 Вечерний отчёт
      </button>

      {/* Report modal */}
      {showReport && (
        <div className="bg-muted/70 rounded-md p-3 mb-3 animate-fade-in border border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground uppercase">Вечерний отчёт — {today}</span>
            <button onClick={() => setShowReport(false)}><X className="w-3 h-3 text-muted-foreground" /></button>
          </div>
          {criteria.map(c => (
            <div key={c.id}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-foreground">{c.name}</span>
                <span className="text-primary font-semibold">{sliderValues[c.id] ?? 5}</span>
              </div>
              <input type="range" min="1" max="10" value={sliderValues[c.id] ?? 5}
                onChange={e => setSliderValues(prev => ({ ...prev, [c.id]: Number(e.target.value) }))}
                className="w-full h-1.5 rounded-full appearance-none bg-muted accent-primary cursor-pointer" />
            </div>
          ))}
          <button onClick={submitReport}
            className="w-full bg-primary text-primary-foreground py-1.5 rounded text-sm font-semibold hover:shadow-[var(--glow-md)] transition-shadow">
            Сохранить отчёт
          </button>
        </div>
      )}

      {/* Individual charts */}
      <div className="flex-1 space-y-2 min-h-0 overflow-y-auto">
        {criteria.map((c, i) => (
          <div key={c.id} className="group">
            <div className="flex items-center justify-between">
              <MiniChart data={c.data} label={c.name} color={COLORS[i % COLORS.length]} />
              <button onClick={() => removeCriterion(c.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                <Trash2 className="w-3 h-3 text-muted-foreground hover:text-primary" />
              </button>
            </div>
          </div>
        ))}

        {/* Add criterion */}
        <div className="pt-2 border-t border-border/30">
          <div className="flex gap-1 items-center">
            <input placeholder="Новый показатель" value={newCriterion} onChange={e => setNewCriterion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCriterion()}
              className="bg-input border border-border rounded px-2 py-1 text-foreground text-xs flex-1" />
            <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer shrink-0" title="Инвертировать (больше = хуже)">
              <input type="checkbox" checked={newInverted} onChange={e => setNewInverted(e.target.checked)} className="accent-primary w-3 h-3" />
              <span>инв.</span>
            </label>
            <button onClick={addCriterion} className="bg-primary/20 text-primary p-1 rounded">
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BiometricsModule;