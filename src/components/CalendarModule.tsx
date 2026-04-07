import { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Calendar as CalIcon, ChevronLeft, ChevronRight, Save, ClipboardList } from 'lucide-react';

export const CalendarModule = () => {
  const [date, setDate] = useState(new Date());
  const [notes, setNotes] = useLocalStorage<Record<string, string>>('ramzes-calendar-notes', {});
  
  // Ключ текущей даты: год-месяц-число
  const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

  // Функция для обновления заметки
  const handleNoteChange = (val: string) => {
    setNotes((prev) => ({
      ...prev,
      [dayKey]: val
    }));
  };

  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  return (
    <div className="glass-panel p-4 h-[650px] flex flex-col bg-black/40 border border-primary/20 font-mono relative overflow-hidden animate-in fade-in duration-500">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-4 border-b border-primary/20 pb-3">
        <div className="flex items-center gap-2 text-primary uppercase tracking-widest text-[10px] font-black">
          <CalIcon className="w-4 h-4 text-primary animate-pulse" /> Chronos Log System
        </div>
        <div className="flex gap-4 items-center bg-black/40 px-3 py-1 border border-primary/10 rounded-sm">
          <button onClick={() => setDate(new Date(date.setMonth(date.getMonth() - 1)))} className="hover:text-primary transition-colors">
            <ChevronLeft className="w-4 h-4"/>
          </button>
          <span className="text-[10px] uppercase font-bold text-primary min-w-[100px] text-center">
            {date.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={() => setDate(new Date(date.setMonth(date.getMonth() + 1)))} className="hover:text-primary transition-colors">
            <ChevronRight className="w-4 h-4"/>
          </button>
        </div>
      </div>

      {/* Сетка календаря */}
      <div className="grid grid-cols-7 gap-1 mb-6 text-[8px] text-center text-primary/40 uppercase font-black">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="py-1">{d}</div>)}
        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const d = i + 1;
          const isSelected = date.getDate() === d;
          const hasNote = !!notes[`${date.getFullYear()}-${date.getMonth()}-${d}`];
          const isToday = new Date().getDate() === d && new Date().getMonth() === new Date().getMonth() && new Date().getFullYear() === new Date().getFullYear();

          return (
            <button 
              key={i} 
              onClick={() => setDate(new Date(date.getFullYear(), date.getMonth(), d))}
              className={`relative p-2 text-[10px] border transition-all duration-200 ${
                isSelected 
                ? 'border-primary bg-primary/20 text-primary shadow-[0_0_10px_rgba(234,56,76,0.3)]' 
                : 'border-primary/5 text-muted-foreground hover:border-primary/40 hover:bg-white/5'
              } ${isToday && !isSelected ? 'text-primary/100 underline decoration-primary' : ''}`}
            >
              {d}
              {hasNote && <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-primary rounded-full shadow-[0_0_3px_#ea384c]" />}
            </button>
          );
        })}
      </div>

      {/* Поле для заметок */}
      <div className="flex-1 flex flex-col gap-3 relative z-10 border-t border-primary/10 pt-4">
        <div className="flex items-center justify-between">
            <label className="text-[9px] uppercase text-primary/60 tracking-widest flex items-center gap-2">
                <ClipboardList className="w-3 h-3" /> Entry for: <span className="text-primary">{dayKey}</span>
            </label>
            {notes[dayKey] && <span className="text-[7px] text-primary/40 uppercase">Data Stored</span>}
        </div>
        
        <textarea 
          value={notes[dayKey] || ''} 
          onChange={(e) => handleNoteChange(e.target.value)}
          placeholder="ВВЕДИТЕ ДАННЫЕ ДЛЯ ПРОТОКОЛА..."
          className="flex-1 bg-black/30 border border-primary/10 p-4 text-xs outline-none focus:border-primary/40 text-primary resize-none placeholder:opacity-10 leading-relaxed tracking-wide shadow-inner"
        />
        
        <div className="text-[7px] text-primary/20 uppercase text-right italic">
            Система RAMZES-13 автоматически сохраняет изменения в локальный сектор.
        </div>
      </div>
    </div>
  );
};
