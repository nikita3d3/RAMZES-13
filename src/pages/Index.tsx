import { useState } from 'react';
import { Target, BookOpen, Activity, Bot } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import MilitaryClock from '@/components/MilitaryClock';
import FinanceModule from '@/components/FinanceModule';
import IntelligenceModule from '@/components/IntelligenceModule';
import BiometricsModule from '@/components/BiometricsModule';
import AIChatModule from '@/components/AIChatModule';
import PinLock from '@/components/PinLock';

const tabs = [
  { id: 'finance', label: 'STRATEGY', icon: Target },
  { id: 'intel', label: 'INTEL', icon: BookOpen },
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
    <div className="min-h-screen bg-background noise-bg flex flex-col">
      {/* Header */}
      <header className="relative z-10 border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-xl tracking-wider text-primary glow-text">
            RAMZES <span className="text-foreground">13</span>
          </h1>
          <div className="hidden sm:block h-4 w-px bg-border" />
          <span className="hidden sm:block text-xs text-muted-foreground uppercase tracking-widest">Экосистема дисциплины</span>
        </div>
        <MilitaryClock />
      </header>

      {/* Desktop: Grid layout */}
      <main className="relative z-10 flex-1 hidden lg:grid grid-cols-3 grid-rows-2 gap-3 p-3 min-h-0">
        <div className="row-span-2">
          <FinanceModule />
        </div>
        <div>
          <IntelligenceModule />
        </div>
        <div>
          <BiometricsModule />
        </div>
        <div className="col-span-2">
          <AIChatModule />
        </div>
      </main>

      {/* Mobile: Tab content */}
      <main className="relative z-10 flex-1 lg:hidden p-3 pb-20 min-h-0 overflow-y-auto">
        <div className="animate-fade-in h-full">
          {activeTab === 'finance' && <FinanceModule />}
          {activeTab === 'intel' && <IntelligenceModule />}
          {activeTab === 'bio' && <BiometricsModule />}
          {activeTab === 'ai' && <AIChatModule />}
        </div>
      </main>

      {/* Mobile: Bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20 glass-panel border-t border-border">
        <div className="flex">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-all duration-200 ${
                  active ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'drop-shadow-[0_0_6px_hsl(0,72%,51%)]' : ''}`} />
                <span className="text-[10px] font-display tracking-wider">{tab.label}</span>
                {active && <div className="w-6 h-0.5 bg-primary rounded-full mt-0.5 shadow-[0_0_8px_hsl(0,72%,51%)]" />}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Index;
