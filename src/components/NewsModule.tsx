import { useState, useEffect } from 'react';
import { Globe, RefreshCw, Newspaper, TrendingUp } from 'lucide-react';

// ВСТАВЬ СВОЙ КЛЮЧ СЮДА
const NEWS_API_KEY = 'pub_04193b7d0ad7420db2cc7802fec4dabf';

export const NewsModule = () => {
  const [rates, setRates] = useState<any>(null);
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Загрузка валют (Бесплатно без ключа)
      const ratesRes = await fetch('https://open.er-api.com/v6/latest/USD');
      const ratesData = await ratesRes.json();
      setRates(ratesData.rates);

      // 2. Загрузка новостей (Используем твой ключ)
      // Мы берем новости на русском (language=ru) и только топовые (category=top)
      if (NEWS_API_KEY !== 'ТВОЙ_КЛЮЧ_ИЗ_NEWSDATA_IO') {
        const newsRes = await fetch(`https://newsdata.io/api/1/news?apikey=${NEWS_API_KEY}&language=ru&category=top`);
        const newsData = await newsRes.json();
        setNews(newsData.results || []);
      }
    } catch (error) {
      console.error("Ошибка загрузки данных:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const currencies = [
    { code: 'RUB', label: 'RUB/USD' },
    { code: 'EUR', label: 'EUR/USD' },
    { code: 'CNY', label: 'CNY/USD' },
    { code: 'GBP', label: 'GBP/USD' }
  ];

  return (
    <div className="glass-panel p-4 h-[650px] flex flex-col bg-black/40 border border-primary/20 font-mono overflow-hidden animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-4 border-b border-primary/20 pb-3">
        <div className="flex items-center gap-2 text-primary uppercase tracking-[0.2em] text-[10px] font-black">
          <Globe className="w-4 h-4 animate-spin-slow" /> Global Intelligence
        </div>
        <button onClick={fetchData} className={`${loading ? 'animate-spin text-primary' : 'text-primary/40'}`}>
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      {/* Блок Валют */}
      <div className="grid grid-cols-2 gap-2 mb-6 text-[10px]">
        {rates ? currencies.map(c => (
          <div key={c.code} className="bg-primary/5 border border-primary/10 p-2 flex justify-between items-center group hover:border-primary/40 transition-all">
            <span className="text-primary/40 font-bold uppercase">{c.label}</span>
            <span className="text-primary glow-text-sm font-black">{Number(rates[c.code]).toFixed(2)}</span>
          </div>
        )) : <div className="col-span-2 py-4 text-center text-primary/20 animate-pulse uppercase">Syncing Currencies...</div>}
      </div>

      {/* Блок Новостей */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
        <div className="text-[9px] text-primary/60 uppercase font-black flex items-center gap-2 mb-3">
            <Newspaper className="w-3 h-3"/> Major World Events
        </div>

        {news.length > 0 ? news.map((article, i) => (
          <a 
            href={article.link} 
            target="_blank" 
            rel="noopener noreferrer" 
            key={i} 
            className="block p-3 border border-primary/5 bg-white/5 hover:bg-primary/5 hover:border-primary/20 transition-all group"
          >
            <div className="text-[10px] text-primary font-bold leading-tight mb-2 group-hover:text-primary tracking-tight uppercase">
              {article.title}
            </div>
            <div className="flex justify-between items-center text-[8px] text-primary/30 uppercase">
              <span className="truncate max-w-[150px]">{article.source_id}</span>
              <span>{new Date(article.pubDate).toLocaleDateString()}</span>
            </div>
          </a>
        )) : (
          <div className="text-center py-20 border border-dashed border-primary/10">
            <div className="text-[9px] text-primary/20 uppercase tracking-widest">
              {NEWS_API_KEY === 'pub_04193b7d0ad7420db2cc7802fec4dabf' 
                ? "[ Введите API KEY для дешифровки потока ]" 
                : "[ Ожидание данных из штаба... ]"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
