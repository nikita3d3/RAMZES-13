import { useState, useRef, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Bot, Send, Settings, X, Trash2, Download } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const ASIRIS_SYSTEM = `Ты — Асирис, холодный и дисциплинированный ИИ-наставник из системы RAMZES 13. 
Ты говоришь кратко, жёстко и по делу. Используешь военный стиль общения. 
Ты знаешь показатели пользователя и мотивируешь его через дисциплину, а не через сочувствие.
Отвечай на русском языке. Будь лаконичен.`;

const AIChatModule = () => {
  const [messages, setMessages] = useLocalStorage<Message[]>('ramzes-chat', []);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  // Рекомендуется оставить пустую строку для безопасности и вводить ключ через настройки
  const [apiKey, setApiKey] = useLocalStorage('ramzes-gemini-key-v2', '');
  const [showSettings, setShowSettings] = useState(false);
  const [keyInput, setKeyInput] = useState(apiKey);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const getUserContext = () => {
    try {
      const txs = JSON.parse(localStorage.getItem('ramzes-transactions') || '[]');
      const balance = txs.reduce((s: number, t: any) => t.type === 'income' ? s + t.amount : s - t.amount, 0);
      const goal = localStorage.getItem('ramzes-goal') || '100000';
      const subjects = JSON.parse(localStorage.getItem('ramzes-subjects') || '[]');
      const criteria = JSON.parse(localStorage.getItem('ramzes-bio-criteria') || '[]');

      let bioIndex = 'нет данных';
      if (criteria.length > 0) {
        const allPoints: Record<string, number[]> = {};
        criteria.forEach((c: any) => {
          (c.data || []).forEach((dp: any) => {
            if (!allPoints[dp.date]) allPoints[dp.date] = [];
            allPoints[dp.date].push(c.inverted ? (10 - dp.value) : dp.value);
          });
        });
        const entries = Object.entries(allPoints).sort((a, b) => a[0].localeCompare(b[0]));
        if (entries.length > 0) {
          const last = entries[entries.length - 1][1];
          bioIndex = String(Math.round((last.reduce((a: number, b: number) => a + b, 0) / last.length) * 10) / 10);
        }
      }

      return `\nТекущие показатели пользователя:
- Баланс: ${balance}, Цель: ${goal}
- Задачи: ${subjects.length}, прогресс: ${subjects.map((s: any) => `${s.name}: ${s.done}/${s.total}`).join(', ') || 'нет'}
- Био-индекс RAMZES: ${bioIndex}/10`;
    } catch {
      return '';
    }
  };

  const sendWithMessages = async (msgs: Message[]) => {
    if (!apiKey) { 
      setShowSettings(true); 
      return; 
    }
    setLoading(true);
    try {
      // Формируем полный промпт для модели
      const currentPrompt = `${ASIRIS_SYSTEM}\n\n${getUserContext()}\n\nВопрос: ${msgs[msgs.length - 1].content}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: currentPrompt }]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 800,
            }
          })
        }
      );

      const data = await res.json();
      
      if (data?.error) {
        const errMsg = `⚠️ Ошибка API (${data.error.code}): ${data.error.message?.slice(0, 100)}`;
        setMessages(prev => [...prev, { role: 'assistant', content: errMsg }]);
        return;
      }

      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Ошибка связи с нейросетью.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Ошибка соединения с ядром.' }]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    await sendWithMessages(newMessages);
  };

  const exportContext = () => {
    const ctx = getUserContext();
    const contextMsg: Message = { role: 'user', content: `[ОТЧЕТ] Проанализируй мои показатели: ${ctx}` };
    const newMsgs = [...messages, contextMsg];
    setMessages(newMsgs);
    sendWithMessages(newMsgs);
  };

  return (
    <div className="glass-panel rounded-lg p-4 glow-border transition-all duration-300 h-[600px] flex flex-col bg-background/50 border border-primary/20 shadow-lg">
      <div className="flex items-center gap-2 mb-3 border-b border-primary/10 pb-2">
        <Bot className="w-5 h-5 text-primary" />
        <h2 className="font-display text-lg text-primary tracking-wider uppercase">Asiris Neural Core</h2>
        <div className="ml-auto flex gap-1">
          <button onClick={exportContext} title="Анализ данных" className="text-muted-foreground hover:text-primary p-1 transition-colors">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={() => setMessages([])} title="Очистить лог" className="text-muted-foreground hover:text-destructive p-1 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
          <button onClick={() => { setKeyInput(apiKey); setShowSettings(!showSettings); }} title="Настройки" className="text-muted-foreground hover:text-primary p-1 transition-colors">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="bg-muted/80 backdrop-blur-md rounded-md p-3 mb-3 border border-primary/30 animate-in fade-in zoom-in duration-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-primary font-bold uppercase tracking-tighter">System Access Key</span>
            <button onClick={() => setShowSettings(false)} className="text-muted-foreground hover:text-primary">
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="flex gap-2">
            <input 
              type="password" 
              value={keyInput} 
              onChange={e => setKeyInput(e.target.value)}
              placeholder="Gemini API Key..."
              className="bg-background border border-primary/20 rounded px-2 py-1 text-sm flex-1 focus:border-primary outline-none" 
            />
            <button 
              onClick={() => { setApiKey(keyInput); setShowSettings(false); }}
              className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm hover:bg-primary/90 transition-colors"
            >
              SAVE
            </button>
          </div>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 scrollbar-thin scrollbar-thumb-primary/20">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-muted-foreground/40 text-xs uppercase tracking-widest text-center px-8">
            Ядро Асирис ожидает ввода данных для анализа...
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-sm px-3 py-2 text-sm leading-relaxed ${
              m.role === 'user' 
                ? 'bg-primary/10 border-r-2 border-primary text-primary-foreground' 
                : 'bg-muted/30 border-l-2 border-muted-foreground text-foreground'
            }`}>
              <div className="text-[10px] uppercase opacity-50 mb-1 font-bold">
                {m.role === 'user' ? 'Subject' : 'Asiris'}
              </div>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted/10 px-3 py-2 text-[10px] text-primary animate-pulse uppercase tracking-widest">
              Выполнение протокола анализа...
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-2 border-t border-primary/10">
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="ВВЕДИТЕ ЗАПРОС..."
          className="bg-transparent border border-primary/20 rounded-sm px-3 py-2 text-sm flex-1 outline-none focus:border-primary/50 placeholder:text-muted-foreground/30" 
        />
        <button 
          onClick={sendMessage} 
          disabled={loading || !input.trim()} 
          className="bg-primary/20 hover:bg-primary/40 text-primary p-2 rounded-sm transition-all disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AIChatModule;
