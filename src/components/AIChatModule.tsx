import { useState, useRef, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Bot, Send, Settings, X, Trash2, Download } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const ASIRIS_SYSTEM = `Ты — Асирис, холодный и дисциплинированный ИИ-наставник из системы RAMZES 13. 
Ты говоришь кратко, жёстко и по делу. Используешь военный стиль общения. 
Ты знаешь показатели пользователя и мотивируешь его через дисциплину.
Отвечай на русском языке. Будь лаконичен.`;

const AIChatModule = () => {
  const [messages, setMessages] = useLocalStorage<Message[]>('ramzes-chat-groq-v2', []);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useLocalStorage('ramzes-groq-key-v2', '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');
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
      
      return `\n[ОТЧЕТ СИСТЕМЫ]\nБаланс: ${balance}\nЦель: ${goal}\nАктивных задач: ${subjects.length}\nСтатус: Анализ...`;
    } catch { return ''; }
  };

  const sendWithMessages = async (msgs: Message[]) => {
    if (!apiKey) { setShowSettings(true); return; }
    setLoading(true);
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: ASIRIS_SYSTEM + getUserContext() },
            ...msgs.map(m => ({ role: m.role, content: m.content }))
          ],
          temperature: 0.6,
          max_tokens: 1024
        })
      });

      const data = await res.json();
      
      if (data?.error) {
        let errorMsg = `⚠️ ОШИБКА GROQ: ${data.error.message}`;
        if (data.error.code === 'invalid_api_key') errorMsg = "⚠️ КЛЮЧ API НЕВЕРЕН. ПРОВЕРЬТЕ НАСТРОЙКИ.";
        setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
      } else {
        const reply = data?.choices?.[0]?.message?.content || 'НЕТ ДАННЫХ ОТ ЯДРА.';
        setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ КРИТИЧЕСКИЙ СБОЙ СЕТИ. ПРОВЕРЬТЕ VPN.' }]);
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
    <div className="glass-panel rounded-lg p-4 h-[600px] flex flex-col bg-black/40 border border-primary/20 shadow-2xl backdrop-blur-md relative overflow-hidden font-mono">
      {/* Декоративная сетка на фоне */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      <div className="flex items-center gap-3 mb-4 border-b border-primary/30 pb-3 relative z-10">
        <div className="p-1 bg-primary/10 rounded-full border border-primary/30">
            <Bot className="w-5 h-5 text-primary" />
        </div>
        <div>
            <h2 className="text-primary text-xs font-black uppercase tracking-[0.3em]">Asiris Groq Core</h2>
            <div className="text-[8px] text-primary/50 uppercase tracking-widest">Protocol: RAMZES-13</div>
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={() => setMessages([])} className="text-muted-foreground hover:text-destructive transition-all">
            <Trash2 className="w-4 h-4" />
          </button>
          <button onClick={() => { setKeyInput(apiKey); setShowSettings(!showSettings); }} className="text-muted-foreground hover:text-primary transition-all">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="bg-black/80 p-4 rounded-sm border border-primary/50 mb-3 relative z-20 animate-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] text-primary font-bold uppercase tracking-widest">Access Configuration</span>
            <button onClick={() => setShowSettings(false)} className="text-primary/50 hover:text-primary"><X className="w-3 h-3" /></button>
          </div>
          <div className="flex flex-col gap-3">
            <input 
              type="password" 
              value={keyInput} 
              onChange={e => setKeyInput(e.target.value)}
              placeholder="Groq API Key (gsk_...)"
              className="bg-black/50 border border-primary/20 rounded-sm px-3 py-2 text-xs outline-none focus:border-primary text-primary placeholder:text-primary/20" 
            />
            <button 
              onClick={() => { setApiKey(keyInput); setShowSettings(false); }}
              className="bg-primary/20 text-primary border border-primary/50 py-1.5 rounded-sm text-[10px] font-bold uppercase hover:bg-primary/40 transition-colors"
            >
              Update Authorization
            </button>
          </div>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 scrollbar-thin scrollbar-thumb-primary/20 relative z-10">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-primary/20 text-[10px] uppercase tracking-[0.5em] text-center">
            System Idle. Waiting for input...
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-sm px-4 py-3 text-sm relative ${
              m.role === 'user' 
                ? 'bg-primary/5 border border-primary/20 text-primary-foreground' 
                : 'bg-white/5 border border-white/10 text-foreground'
            }`}>
              <div className={`text-[8px] uppercase mb-1 font-black tracking-widest ${m.role === 'user' ? 'text-primary' : 'text-muted-foreground'}`}>
                {m.role === 'user' ? '>> Subject' : '>> Asiris Unit'}
              </div>
              <div className="leading-relaxed whitespace-pre-wrap">{m.content}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-[9px] text-primary animate-pulse font-bold tracking-[0.2em] ml-2">
             <span className="flex h-1.5 w-1.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
             </span>
             Processing Request...
          </div>
        )}
      </div>

      <div className="flex gap-2 border-t border-primary/10 pt-4 relative z-10">
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="ВВЕДИТЕ ПРИКАЗ..."
          className="bg-black/20 border border-primary/20 rounded-sm px-4 py-2.5 text-xs flex-1 outline-none focus:border-primary/50 text-primary placeholder:text-primary/10 transition-all" 
        />
        <button 
          onClick={sendMessage} 
          disabled={loading || !input.trim()} 
          className="bg-primary/10 text-primary px-4 rounded-sm hover:bg-primary/20 border border-primary/30 transition-all disabled:opacity-5"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AIChatModule;
