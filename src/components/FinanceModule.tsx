import { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Plus, Minus, Trash2, Target, TrendingUp, TrendingDown, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  date: string;
}

const CATEGORIES_INCOME = ['Зарплата', 'Фриланс', 'Подарок', 'Другое'];
const CATEGORIES_EXPENSE = ['Еда', 'Транспорт', 'Жильё', 'Развлечения', 'Долг', 'Другое'];

const FinanceModule = () => {
  const [goal, setGoal] = useLocalStorage('ramzes-goal', 100000);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('ramzes-transactions', []);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(String(goal));
  const [showModal, setShowModal] = useState<'income' | 'expense' | null>(null);
  const [modalAmount, setModalAmount] = useState('');
  const [modalCategory, setModalCategory] = useState('');
  const [modalDesc, setModalDesc] = useState('');

  // Compute balance
  const balance = transactions.reduce((s, t) => t.type === 'income' ? s + t.amount : s - t.amount, 0);
  const goalProgress = goal > 0 ? Math.min(100, Math.max(0, (balance / goal) * 100)) : 0;

  // 7-day trend
  const now = new Date();
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });

  const trendData = last7.map(dateStr => {
    const dayTxs = transactions.filter(t => t.date.slice(0, 10) === dateStr);
    const net = dayTxs.reduce((s, t) => t.type === 'income' ? s + t.amount : s - t.amount, 0);
    return { date: dateStr.slice(5), value: net };
  });

  const addTransaction = () => {
    if (!modalAmount || isNaN(Number(modalAmount)) || !showModal) return;
    const tx: Transaction = {
      id: crypto.randomUUID(),
      amount: Math.abs(Number(modalAmount)),
      type: showModal,
      category: modalCategory || (showModal === 'income' ? 'Другое' : 'Другое'),
      description: modalDesc || modalCategory || (showModal === 'income' ? 'Доход' : 'Расход'),
      date: new Date().toISOString(),
    };
    setTransactions(prev => [tx, ...prev]);
    setModalAmount('');
    setModalCategory('');
    setModalDesc('');
    setShowModal(null);
  };

  const removeTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const categories = showModal === 'income' ? CATEGORIES_INCOME : CATEGORIES_EXPENSE;

  return (
    <div className="glass-panel rounded-lg p-4 glow-border glow-border-hover transition-all duration-300 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-primary" />
        <h2 className="font-display text-lg text-primary">Финансовый Стратег</h2>
      </div>

      {/* Live Balance */}
      <div className="text-center mb-3">
        <span className="text-xs text-muted-foreground uppercase">Живой Баланс</span>
        <div className={`font-display text-4xl glow-text ${balance >= 0 ? 'text-primary' : 'text-destructive'}`}>
          {balance.toLocaleString()}
        </div>
      </div>

      {/* Goal */}
      <div className="mb-3">
        {editingGoal ? (
          <div className="flex gap-2">
            <input type="number" value={goalInput} onChange={e => setGoalInput(e.target.value)}
              className="bg-input border border-border rounded px-2 py-1 text-foreground text-sm w-full" />
            <button onClick={() => { setGoal(Number(goalInput) || 100000); setEditingGoal(false); }}
              className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded">OK</button>
          </div>
        ) : (
          <div className="flex justify-between items-baseline cursor-pointer" onClick={() => { setGoalInput(String(goal)); setEditingGoal(true); }}>
            <span className="text-muted-foreground text-xs">ЦЕЛЬ</span>
            <span className="font-display text-xl text-foreground">{goal.toLocaleString()}</span>
          </div>
        )}
        <div className="mt-1">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>ПРОГРЕСС К ЦЕЛИ</span>
            <span>{goalProgress.toFixed(1)}%</span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full red-gradient-bar rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${goalProgress}%` }} />
          </div>
        </div>
      </div>

      {/* 7-day micro trend */}
      <div className="mb-3">
        <div className="text-xs text-muted-foreground mb-1 uppercase">Тренд 7 дней</div>
        <ResponsiveContainer width="100%" height={60}>
          <LineChart data={trendData}>
            <XAxis dataKey="date" hide />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip contentStyle={{ background: 'hsl(0 0% 5%)', border: '1px solid hsl(0 0% 15%)', borderRadius: '6px', fontSize: '11px' }}
              labelStyle={{ color: 'hsl(0 0% 55%)' }} />
            <Line type="monotone" dataKey="value" stroke="hsl(0, 72%, 51%)" strokeWidth={2} dot={false}
              style={{ filter: 'drop-shadow(0 0 4px hsl(0 72% 51% / 0.5))' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 mb-3">
        <button onClick={() => setShowModal('income')}
          className="flex-1 flex items-center justify-center gap-1 bg-primary/20 text-primary py-2 rounded text-sm font-semibold hover:bg-primary/30 transition-colors">
          <Plus className="w-4 h-4" /> Доход
        </button>
        <button onClick={() => setShowModal('expense')}
          className="flex-1 flex items-center justify-center gap-1 bg-destructive/20 text-destructive py-2 rounded text-sm font-semibold hover:bg-destructive/30 transition-colors">
          <Minus className="w-4 h-4" /> Расход
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="bg-muted/70 rounded-md p-3 mb-3 animate-fade-in border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground uppercase">
              {showModal === 'income' ? 'Новый доход' : 'Новый расход'}
            </span>
            <button onClick={() => setShowModal(null)}><X className="w-3 h-3 text-muted-foreground" /></button>
          </div>
          <input type="number" placeholder="Сумма" value={modalAmount} onChange={e => setModalAmount(e.target.value)}
            className="bg-input border border-border rounded px-2 py-1.5 text-foreground text-sm w-full mb-2" />
          <div className="flex flex-wrap gap-1 mb-2">
            {categories.map(c => (
              <button key={c} onClick={() => setModalCategory(c)}
                className={`text-xs px-2 py-1 rounded border transition-colors ${modalCategory === c ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-border text-muted-foreground hover:text-foreground'}`}>
                {c}
              </button>
            ))}
          </div>
          <input type="text" placeholder="Описание (опционально)" value={modalDesc} onChange={e => setModalDesc(e.target.value)}
            className="bg-input border border-border rounded px-2 py-1.5 text-foreground text-sm w-full mb-2" />
          <button onClick={addTransaction}
            className="w-full bg-primary text-primary-foreground py-1.5 rounded text-sm font-semibold hover:shadow-[var(--glow-md)] transition-shadow">
            Добавить
          </button>
        </div>
      )}

      {/* Transactions */}
      <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
        {transactions.slice(0, 15).map(tx => (
          <div key={tx.id} className="flex items-center justify-between text-xs bg-muted/30 rounded px-2 py-1.5 group">
            <div className="flex items-center gap-2 min-w-0">
              {tx.type === 'income' ? <TrendingUp className="w-3 h-3 text-primary shrink-0" /> : <TrendingDown className="w-3 h-3 text-destructive shrink-0" />}
              <span className="truncate text-foreground">{tx.description}</span>
              <span className="text-muted-foreground shrink-0">({tx.category})</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`font-semibold ${tx.type === 'income' ? 'text-primary' : 'text-destructive'}`}>
                {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString()}
              </span>
              <span className="text-muted-foreground">{new Date(tx.date).toLocaleDateString('ru-RU')}</span>
              <button onClick={() => removeTransaction(tx.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="w-3 h-3 text-muted-foreground hover:text-primary" />
              </button>
            </div>
          </div>
        ))}
        {transactions.length === 0 && (
          <div className="text-center text-muted-foreground text-xs py-4">Нет транзакций</div>
        )}
      </div>
    </div>
  );
};

export default FinanceModule;