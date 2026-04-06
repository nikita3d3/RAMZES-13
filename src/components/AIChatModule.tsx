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
  const [messages, setMessages] = useLocalStorage<Message[]>('ramzes-chat-v3', []);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  // Твой новый ключ
  const [apiKey, setApiKey] = useLocalStorage('ramzes-gemini-key-v3', 'AIzaSyDdxH5Lgg3z_aQaNi4oS0vaOOzhMbpKXKs');
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
      
      return `\nОТЧЕТ СИСТЕМЫ:\n- Баланс: ${balance}\n- Цель: ${goal}\n- Активных задач: ${subjects.length}`;
    } catch { return ''; }
  };

  const sendWithMessages = async (msgs: Message[]) => {
    if (!apiKey) { setShowSettings(true); return; }
    setLoading(true);
    try {
      const promptText = `${ASIRIS_SYSTEM}\n\n${getUserContext()}\n\nЗАПРОС СУБЪЕКТА: ${msgs[msgs.length - 1].content}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: promptText }]
              }
            ]
          })
        }
      );

      const data = await res.json();
      
      if (data?.error) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `⚠️ ОТКАЗ СИСТЕМЫ (${data.error.code}): ${data.error.message}` 
        }]);
      } else {
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'ОШИБКА ЯДРА: Нет ответа.';
        setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ КРИТИЧЕСКИЙ СБОЙ СВЯЗИ.' }]);
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

  return (
    <div className="glass-panel rounded-lg p-4 h-[600px] flex flex-col bg-background/80 border border-primary/20 shadow-2xl overflow-hidden font-sans">
      <div className="flex items-center gap-2 mb-4 border-b border-primary/10 pb-2">
        <Bot className="w-5 h-5 text-primary" />
        <h2 className="font-display text-primary text-sm uppercase tracking-[0.2em]">Asiris Neural Core</h2>
        <div className="ml-auto flex gap-2">
          <button onClick={() => setMessages([])} className="text-muted-foreground hover:text-destructive transition-colors p-1">
            <Trash2 className="w-4 h-4" />
          </button>
          <button onClick={() => { setKeyInput(apiKey); setShowSettings(!showSettings); }} className="text-muted-foreground hover:text-primary transition-colors p-1">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="bg-black/40 p-3 rounded border border-primary/30 mb-3 animate-in fade-in slide-in-from-top-1">
          <label className="text-[10px] text-primary uppercase font-bold mb-2 block">System Access Key</label>
          <div className="flex gap-2">
            <input type="password" value={keyInput} onChange={e => setKeyInput(e.target.value)}
              className="bg-background/50 border border-primary/20 rounded px-2 py-1 text-xs flex-1 outline-none focus:border-primary text-primary" />
            <button onClick={() => { setApiKey(keyInput); setShowSettings(false); }}
              className="bg-primary/20 text-primary border border-primary/40 px-3 py-1 rounded text-[10px] font-bold hover:bg-primary/40">SAVE</button>
          </div>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 scrollbar-hide">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] rounded-lg px-4 py-3 text-sm ${
              m.role === 'user' 
                ? 'bg-primary/10 border border-primary/20 text-primary-foreground' 
                : 'bg-muted/40 border border-white/5 text-foreground'
            }`}>
              <div className="text-[9px] uppercase opacity-40 mb-1 font-black tracking-widest">
                {m.role === 'user' ? 'Subject' : 'Asiris Unit'}
              </div>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-[10px] text-primary animate-pulse tracking-[0.3em] uppercase ml-2">
             <span className="w-1.5 h-1.5 bg-primary rounded-full" /> Анализ данных...
          </div>
        )}
      </div>

      <div className="flex gap-2 border-t border-primary/10 pt-4">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="ВВОД ДАННЫХ..."
          className="bg-black/20 border border-primary/10 rounded-md px-4 py-2 text-sm flex-1 outline-none focus:border-primary/40 placeholder:text-muted-foreground/30 text-primary" />
        <button onClick={sendMessage} disabled={loading || !input.trim()}
          className="bg-primary/10 hover:bg-primary/20 text-primary p-2 rounded-md disabled:opacity-10 transition-all border border-primary/20">
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default AIChatModule;
