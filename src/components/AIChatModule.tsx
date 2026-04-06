import { useState, useRef, useEffect, useMemo } from 'react';
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
  const [apiKey, setApiKey] = useLocalStorage('ramzes-gemini-key-v2', 'AIzaSyDNf0fQhuMM6dZh54Z3nrbTuqzSIpaDCt0');
  const [showSettings, setShowSettings] = useState(false);
  const [keyInput, setKeyInput] = useState(apiKey);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const getUserContext = () => {
    try {
      const txs = JSON.parse(localStorage.getItem('ramzes-transactions') || '[]');
      const balance = txs.reduce((s: number, t: any) => t.type === 'income' ? s + t.amount : s - t.amount, 0);
      const goal = localStorage.getItem('ramzes-goal') || '100000';
      const subjects = JSON.parse(localStorage.getItem('ramzes-subjects') || '[]');
      const criteria = JSON.parse(localStorage.getItem('ramzes-bio-criteria') || '[]');

      // Compute bio index
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
- Био-индекс RAMZES: ${bioIndex}/10
- Критерии здоровья: ${criteria.map((c: any) => c.name).join(', ') || 'нет'}`;
    } catch {
      return '';
    }
  };

  const exportContext = () => {
    const ctx = getUserContext();
    if (ctx) {
      const contextMsg: Message = { role: 'user', content: `[ЭКСПОРТ КОНТЕКСТА] Вот мои текущие показатели для анализа:${ctx}\n\nДай мне полный анализ ситуации и рекомендации.` };
      setMessages(prev => [...prev, contextMsg]);
      // Auto-send
      sendWithMessages([...messages, contextMsg]);
    }
  };

  const sendWithMessages = async (msgs: Message[]) => {
    if (!apiKey) { setShowSettings(true); return; }
    setLoading(true);
    try {
     const res = await fetch(
        https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey},
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: ${ASIRIS_SYSTEM}\n\n${getUserContext()}\n\nВопрос: ${msgs[msgs.length - 1].content} }]
            }]
          })
        }
      const data = await res.json();
      if (data?.error) {
        const errMsg = data.error.code === 429
          ? '⚠ Лимит API исчерпан. Подожди минуту или проверь тарифный план Gemini.'
          : `⚠ Ошибка API (${data.error.code}): ${data.error.message?.slice(0, 100)}`;
        setMessages(prev => [...prev, { role: 'assistant', content: errMsg }]);
        return;
      }
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Ошибка связи с нейросетью.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠ Ошибка подключения. Проверь API ключ.' }]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    sendWithMessages(newMessages);
  };

  return (
    <div className="glass-panel rounded-lg p-4 glow-border glow-border-hover transition-all duration-300 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Bot className="w-5 h-5 text-primary" />
        <h2 className="font-display text-lg text-primary">Asiris Neural Core</h2>
        <div className="ml-auto flex gap-1">
          <button onClick={exportContext} title="Экспорт контекста"
            className="text-muted-foreground hover:text-primary transition-colors p-1">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={() => setMessages([])} className="text-muted-foreground hover:text-primary transition-colors p-1">
            <Trash2 className="w-4 h-4" />
          </button>
          <button onClick={() => { setKeyInput(apiKey); setShowSettings(!showSettings); }}
            className="text-muted-foreground hover:text-primary transition-colors p-1">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="bg-muted/50 rounded-md p-3 mb-3 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground uppercase">Gemini API Key</span>
            <button onClick={() => setShowSettings(false)}><X className="w-3 h-3 text-muted-foreground" /></button>
          </div>
          <div className="flex gap-2">
            <input type="password" value={keyInput} onChange={e => setKeyInput(e.target.value)}
              placeholder="AIza..."
              className="bg-input border border-border rounded px-2 py-1.5 text-foreground text-sm flex-1" />
            <button onClick={() => { setApiKey(keyInput); setShowSettings(false); }}
              className="bg-primary text-primary-foreground px-3 py-1.5 rounded text-sm">
              Сохранить
            </button>
          </div>
        </div>
      )}

      {/* Chat messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 min-h-0 mb-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Bot className="w-8 h-8 text-primary/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Асирис на связи. Введи запрос, оперативник.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
              m.role === 'user'
                ? 'bg-primary/20 text-foreground'
                : 'bg-muted/50 text-foreground border border-primary/10'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted/50 rounded-lg px-3 py-2 text-sm text-muted-foreground animate-pulse">
              Асирис анализирует...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !loading && sendMessage()}
          placeholder={apiKey ? 'Запрос к Асирису...' : 'Настрой API ключ ↗'}
          className="bg-input border border-border rounded px-3 py-2 text-foreground text-sm flex-1" />
        <button onClick={sendMessage} disabled={loading || !input.trim()}
          className="bg-primary text-primary-foreground p-2 rounded hover:shadow-[var(--glow-md)] transition-shadow disabled:opacity-30">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AIChatModule;
