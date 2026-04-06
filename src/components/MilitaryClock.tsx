import { useState, useEffect } from 'react';

const MilitaryClock = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const time = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const date = now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  const day = now.toLocaleDateString('ru-RU', { weekday: 'long' });

  return (
    <div className="flex items-center gap-3 text-muted-foreground text-sm">
      <span className="text-primary glow-text font-bold text-lg tracking-widest font-mono">{time}</span>
      <span className="hidden sm:inline capitalize">{date}</span>
      <span className="hidden sm:inline opacity-50 capitalize">{day}</span>
    </div>
  );
};

export default MilitaryClock;
