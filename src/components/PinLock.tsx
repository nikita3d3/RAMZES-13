import { useState, useEffect } from 'react';

const PIN_CODE = '1313';

const PinLock = ({ onUnlock }: { onUnlock: () => void }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (pin.length === 4) {
      if (pin === PIN_CODE) {
        onUnlock();
      } else {
        setError(true);
        setTimeout(() => { setPin(''); setError(false); }, 600);
      }
    }
  }, [pin, onUnlock]);

  const handleKey = (num: string) => {
    if (pin.length < 4) setPin(prev => prev + num);
  };

  const handleDelete = () => setPin(prev => prev.slice(0, -1));

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center noise-bg">
      <h1 className="font-display text-2xl tracking-wider text-primary glow-text mb-1">RAMZES <span className="text-foreground">13</span></h1>
      <p className="text-xs text-muted-foreground mb-8 uppercase tracking-widest">Введите код доступа</p>

      {/* Dots */}
      <div className={`flex gap-4 mb-10 ${error ? 'animate-shake' : ''}`}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-200 ${
            i < pin.length
              ? 'bg-primary border-primary shadow-[0_0_8px_hsl(0,72%,51%)]'
              : 'border-muted-foreground/40 bg-transparent'
          }`} />
        ))}
      </div>

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-4">
        {['1','2','3','4','5','6','7','8','9','','0','⌫'].map(key => (
          <button key={key}
            onClick={() => {
              if (key === '⌫') handleDelete();
              else if (key !== '') handleKey(key);
            }}
            disabled={key === ''}
            className={`w-16 h-16 rounded-full text-xl font-display transition-all duration-150 ${
              key === '' ? 'invisible' :
              key === '⌫' ? 'text-muted-foreground hover:text-foreground text-base' :
              'border border-border/50 text-foreground hover:bg-primary/20 hover:border-primary/50 active:scale-95'
            }`}
          >
            {key}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PinLock;
