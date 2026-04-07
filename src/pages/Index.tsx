import { useState } from 'react';
import { Target, BookOpen, Activity, Bot, Calendar, Globe } from 'lucide-react';
import MilitaryClock from '../components/MilitaryClock';
import FinanceModule from '../components/FinanceModule';
import IntelligenceModule from '../components/IntelligenceModule';
import BiometricsModule from '../components/BiometricsModule';
import AIChatModule from '../components/AIChatModule';
import { CalendarModule } from '../components/CalendarModule';
import { NewsModule } from '../components/NewsModule';
import PinLock from '../components/PinLock';

const tabs = [
  { id: 'finance', label: 'STRATEGY', icon: Target },
  { id: 'intel', label: 'INTEL', icon: BookOpen },
  { id: 'calendar', label: 'LOGS', icon: Calendar },
  { id: 'news', label: 'WORLD', icon: Globe },
  { id: 'bio', label: 'BIO', icon: Activity },
  { id: 'ai', label: 'ASIRIS', icon: Bot },
] as const;

type TabId = typeof tabs[number]['id'];

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabId>('finance');
  const [unlocked, setUnlocked] = useState(false);

  if (!unlocked) {
    return <PinLock onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <div className="min-h-screen bg-background noise-bg flex flex-col font-mono selection:bg-primary selection:text-black">
      {/* Шапка — всегда сверху */}
      <header className="relative z-10 border-b border-primary/20 px-4 py-3 flex items-center justify-between bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-xl tracking-tighter text-primary glow-text uppercase">
            RAMZES <span className="text-foreground">13</span>
          </h1>
          <div className="h-4 w-px bg-primary/20" />
          <span className="text-[8px] text-primary/60 uppercase tracking-[0.4em] hidden sm:block">Tactical Environment v4.0</span>
        </div>
        <MilitaryClock />
      </header>

      {/* Основной контент — теперь ОДИН блок для всех устройств */}
      <main className="relative z-10 flex-1 flex flex-col items-center w-full max-w-5xl mx-auto p-3 sm:p-6 mb-20 overflow-y-auto min-h-0">
        <div className="w-full animate-fade-in">
          {activeTab === 'finance' && <FinanceModule />}
          {activeTab === 'intel' && <IntelligenceModule />}
          {activeTab === 'bio' && <BiometricsModule />}
          {activeTab === 'ai' && <AIChatModule />}
          {activeTab === 'calendar' && <CalendarModule />}
          {activeTab === 'news' && <NewsModule />}
        </div>
      </main>

      {/* Навигация — теперь ВСЕГДА снизу и адаптирована под ширину */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 bg-black/90 border-t border-primary/30 backdrop-blur-lg">
        <div className="flex max-w-5xl mx-auto justify-around">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center py-4 sm:py-6 transition-all duration-300 group ${
                  active ? 'text-primary bg-primary/5' : 'text-primary/30 hover:text-primary/60'
                }`}
              >
                <Icon className={`w-5 h-5 sm:w-6 sm:h-6 mb-1 transition-transform ${active ? 'scale-110 drop-shadow-[0_0_8px_rgba(234,56,76,0.8)]' : 'group-hover:scale-110'}`} />
                <span className={`text-[7px] sm:text-[9px] font-black tracking-widest transition-opacity ${active ? 'opacity-100' : 'opacity-50'}`}>
                  {tab.label}
                </span>
                {active && (
                  <div className="absolute bottom-0 w-12 h-0.5 bg-primary shadow-[0_-2px_10px_#ea384c] animate-in slide-in-from-bottom-1" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Index;
