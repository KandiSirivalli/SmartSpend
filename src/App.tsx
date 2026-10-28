import { useEffect, useMemo, useState } from 'react';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { motion } from 'motion/react';
import { Wallet, TrendingUp, TrendingDown, Plus, Search, UserRound, LogOut, X, ArrowUpRight, ArrowDownRight, Cloud, ShieldCheck, LoaderCircle } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

type Tx = { id: string; title: string; category: string; amount: number; kind: 'income'|'expense'; date: string; user_id?: string };
const localKey = 'smartspend_transactions';
const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const supabase: SupabaseClient | null = envUrl && envKey && !envUrl.includes('YOUR_PROJECT') && !envKey.includes('YOUR_') ? createClient(envUrl, envKey) : null;
const initial: Tx[] = [
  { id:'sample-1', title:'Monthly salary', category:'Income', amount:42000, kind:'income', date:new Date().toISOString().slice(0,10) },
  { id:'sample-2', title:'Groceries', category:'Food', amount:1250, kind:'expense', date:new Date().toISOString().slice(0,10) },
  { id:'sample-3', title:'Internet bill', category:'Bills', amount:799, kind:'expense', date:new Date().toISOString().slice(0,10) },
  { id:'sample-4', title:'Freelance work', category:'Side income', amount:6500, kind:'income', date:new Date().toISOString().slice(0,10) }
];
const money = (n:number) => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);
const colors = ['#8b7cff','#45d6b5','#f6b85f','#f278a7','#68b9ff'];

function loadLocal(): Tx[] {
  try {
    const raw = localStorage.getItem(localKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return initial;
}
export default function App() {
  const [user,setUser] = useState<User|null>(null);
  const [authReady,setAuthReady] = useState(!supabase);
  const [mode,setMode] = useState<'login'|'signup'>('login');
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [fullName,setFullName] = useState('');
  const [authError,setAuthError] = useState('');
  const [notice,setNotice] = useState('');
  const [transactions,setTransactions] = useState<Tx[]>(loadLocal);
  const [search,setSearch] = useState('');
  const [showAdd,setShowAdd] = useState(false);
  const [showProfile,setShowProfile] = useState(false);
  const [title,setTitle] = useState('');
  const [category,setCategory] = useState('Food');
  const [amount,setAmount] = useState('');
  const [kind,setKind] = useState<'expense'|'income'>('expense');
  const [date,setDate] = useState(new Date().toISOString().slice(0,10));
  const [busy,setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({data}) => { setUser(data.session?.user ?? null); setAuthReady(true); });
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_event,session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !user) return;
    let alive = true;
    (async () => {
      const {data,error} = await supabase!.from('transactions').select('*').order('date',{ascending:false});
      if (alive && !error && data) {
        const cloud = data as Tx[];
        // Keep old browser transactions available for an explicit one-time import.
        setTransactions(cloud);
        localStorage.setItem('smartspend_cloud_loaded','yes');
      } else if (alive && error) setNotice('Could not load cloud transactions. Check that you ran supabase/schema.sql.');
    })();
    return () => { alive = false; };
  }, [user]);

  const income = transactions.filter(t=>t.kind==='income').reduce((s,t)=>s+Number(t.amount),0);
  const expenses = transactions.filter(t=>t.kind==='expense').reduce((s,t)=>s+Number(t.amount),0);
  const filtered = useMemo(()=>transactions.filter(t=>(t.title+' '+t.category).toLowerCase().includes(search.toLowerCase())),[transactions,search]);
  const chartData = useMemo(()=> {
    const labels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    return labels.map((day,i)=>({day,income:Math.round(income*(0.05+i*0.018)),expense:Math.round(expenses*(0.06+i*0.014))}));
  },[income,expenses]);
  const pieData = useMemo(()=> {
    const totals = new Map<string,number>();
    transactions.filter(t=>t.kind==='expense').forEach(t=>totals.set(t.category,(totals.get(t.category)||0)+Number(t.amount)));
    return [...totals].map(([name,value])=>({name,value}));
  },[transactions]);

  async function authSubmit(e:React.FormEvent) {
    e.preventDefault(); setAuthError(''); setBusy(true);
    if (!supabase) { setAuthError('Supabase is not configured yet. Follow the README setup steps first.'); setBusy(false); return; }
    try {
      if (mode==='signup') {
        const {error} = await supabase.auth.signUp({email,password,options:{data:{full_name:fullName}}});
        if (error) throw error;
        setNotice('Account created. If email confirmation is enabled, check your inbox before logging in.');
      } else {
        const {error} = await supabase.auth.signInWithPassword({email,password});
        if (error) throw error;
      }
    } catch (err) { setAuthError(err instanceof Error ? err.message : 'Something went wrong.'); }
    finally { setBusy(false); }
  }
  async function addTransaction(e:React.FormEvent) {
    e.preventDefault();
    const newTx:Tx = {id:crypto.randomUUID(),title:title.trim(),category,amount:Number(amount),kind,date};
    if (!newTx.title || !Number.isFinite(newTx.amount) || newTx.amount<=0) return;
    if (supabase && user) {
      const {data,error} = await supabase.from('transactions').insert({title:newTx.title,category:newTx.category,amount:newTx.amount,kind:newTx.kind,date:newTx.date,user_id:user.id}).select().single();
      if (error) { setNotice('Could not save transaction: '+error.message); return; }
      setTransactions(prev=>[data as Tx,...prev]);
    } else {
      const next = [newTx,...transactions]; setTransactions(next); localStorage.setItem(localKey,JSON.stringify(next));
    }
    setTitle('');setAmount('');setShowAdd(false);setNotice('Transaction added successfully.');
  }
  async function deleteTx(tx:Tx) {
    if (supabase && user && !tx.id.startsWith('sample-')) {
      const {error} = await supabase.from('transactions').delete().eq('id',tx.id);
      if (error) { setNotice('Could not delete transaction: '+error.message); return; }
    }
    const next=transactions.filter(t=>t.id!==tx.id);setTransactions(next);localStorage.setItem(localKey,JSON.stringify(next));
  }
  async function importOldTransactions() {
    if (!supabase || !user) { setNotice('Log in to a configured Supabase account first.'); return; }
    const old = loadLocal().filter(t=>!t.id.startsWith('sample-'));
    if (!old.length) { setNotice('No saved old transactions were found under the SmartSpend storage key. You can add them manually.'); return; }
    const rows=old.map(t=>({title:t.title,category:t.category||'Other',amount:Number(t.amount),kind:t.kind,date:t.date||new Date().toISOString().slice(0,10),user_id:user.id}));
    const {data,error}=await supabase.from('transactions').insert(rows).select();
    if(error){setNotice('Import failed: '+error.message);return;}
    setTransactions(prev=>[...(data as Tx[]),...prev]);setNotice(`Imported ${data?.length||0} old transaction(s).`);
  }

  if (!authReady) return <div className="loading"><LoaderCircle className="spin"/> Checking your session…</div>;
  if (supabase && !user) return <main className="auth-shell"><motion.section initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} className="auth-card">
    <div className="brand-mark"><Wallet/></div><p className="eyebrow">YOUR MONEY, IN FOCUS</p><h1>{mode==='login'?'Welcome back':'Create your account'}</h1><p className="muted">SmartSpend keeps your finances organized and private.</p>
    <form onSubmit={authSubmit} className="form-stack">
      {mode==='signup'&&<label>Full name<input value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Your name" required/></label>}
      <label>Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required/></label>
      <label>Password<input type="password" minLength={6} value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 6 characters" required/></label>
      {authError&&<p className="error">{authError}</p>}{notice&&<p className="notice">{notice}</p>}
      <button className="primary full" disabled={busy}>{busy?'Please wait…':mode==='login'?'Log in':'Create account'}</button>
    </form>
    <p className="auth-switch">{mode==='login'?"Don't have an account?":"Already have an account?"} <button className="text-button" onClick={()=>{setMode(mode==='login'?'signup':'login');setAuthError('');setNotice('');}}>{mode==='login'?'Sign up':'Log in'}</button></p>
    <p className="tiny"><ShieldCheck size={14}/> Your account is protected by Supabase Authentication.</p>
  </motion.section></main>;

  return <main className="app-shell">
    <aside className="sidebar"><div className="brand"><span className="brand-mark small"><Wallet size={20}/></span><span>SmartSpend</span></div><div className="nav-active"><span className="nav-dot"/> Overview</div><div className="side-bottom"><div className="secure"><ShieldCheck size={16}/><span>Private workspace</span></div><button className="profile-mini" onClick={()=>setShowProfile(true)}><span className="avatar">{(user?.user_metadata?.full_name||user?.email||'S').slice(0,1).toUpperCase()}</span><span className="profile-mini-text"><b>{user?.user_metadata?.full_name||'My profile'}</b><small>{user?.email||'Local preview'}</small></span><UserRound size={17}/></button></div></aside>
    <section className="main-content"><header className="topbar"><div><p className="eyebrow">PERSONAL FINANCE</p><h1>Good to see you{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name.split(' ')[0]}` : ''} ✨</h1><p className="muted">Here's what's happening with your money.</p></div><div className="top-actions"><span className="cloud-status"><Cloud size={15}/>{supabase?'Cloud connected':'Local preview'}</span><button className="avatar clickable" onClick={()=>setShowProfile(true)} title="Open profile">{(user?.user_metadata?.full_name||user?.email||'S').slice(0,1).toUpperCase()}</button></div></header>
    {notice&&<div className="notice-bar">{notice}<button onClick={()=>setNotice('')} aria-label="Dismiss"><X size={15}/></button></div>}
    {!supabase&&<div className="setup-banner"><ShieldCheck size={20}/><div><b>Preview mode</b><p>Set up Supabase using README.md to enable private accounts and cloud storage. Your local transactions remain in this browser.</p></div></div>}
    <div className="stats-grid"><motion.div className="stat-card" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}><div className="stat-top"><span>Total balance</span><span className="stat-icon purple"><Wallet size={19}/></span></div><strong>{money(income-expenses)}</strong><small className="positive">Income minus expenses</small></motion.div><motion.div className="stat-card" initial={{opacity:0,y:12}} animate={{opacity:1,y:0,transition:{delay:.08}}}><div className="stat-top"><span>Total income</span><span className="stat-icon green"><TrendingUp size={19}/></span></div><strong>{money(income)}</strong><small className="positive">All recorded income</small></motion.div><motion.div className="stat-card" initial={{opacity:0,y:12}} animate={{opacity:1,y:0,transition:{delay:.16}}}><div className="stat-top"><span>Total expenses</span><span className="stat-icon orange"><TrendingDown size={19}/></span></div><strong>{money(expenses)}</strong><small className="muted">All recorded expenses</small></motion.div></div>
    <div className="charts-grid"><section className="panel"><div className="panel-heading"><div><h2>Cash flow</h2><p className="muted">A simple weekly overview</p></div><span className="period">This week</span></div><div className="chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#45d6b5" stopOpacity={.28}/><stop offset="100%" stopColor="#45d6b5" stopOpacity={0}/></linearGradient></defs><XAxis dataKey="day" axisLine={false} tickLine={false} stroke="#7d859e"/><YAxis hide/><Tooltip contentStyle={{background:'#171d31',border:'1px solid #2b3450',borderRadius:12}}/><Area type="monotone" dataKey="income" stroke="#45d6b5" fill="url(#incomeFill)" strokeWidth={2.5}/><Area type="monotone" dataKey="expense" stroke="#8b7cff" fill="transparent" strokeWidth={2.5}/></AreaChart></ResponsiveContainer></div><div className="legend"><span><i className="mint"/>Income</span><span><i className="lavender"/>Expenses</span></div></section>
    <section className="panel"><div className="panel-heading"><div><h2>Spending categories</h2><p className="muted">Where expenses go</p></div></div>{pieData.length?<><div className="pie-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={82} paddingAngle={4}>{pieData.map((_,i)=><Cell key={i} fill={colors[i%colors.length]}/>)}</Pie><Tooltip contentStyle={{background:'#171d31',border:'1px solid #2b3450',borderRadius:12}}/></PieChart></ResponsiveContainer></div><div className="category-list">{pieData.slice(0,4).map((d,i)=><div key={d.name}><span><i style={{background:colors[i%colors.length]}}/>{d.name}</span><b>{money(d.value)}</b></div>)}</div></>:<p className="empty">Add an expense to see your categories.</p>}</section></div>
    <section className="panel transactions-panel"><div className="panel-heading transaction-heading"><div><h2>Recent transactions</h2><p className="muted">Your latest money activity</p></div><div className="transaction-actions"><label className="search-box"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search"/></label><button className="primary" onClick={()=>setShowAdd(true)}><Plus size={17}/> Add transaction</button></div></div>
    <div className="transaction-list">{filtered.length?filtered.map(tx=><div className="transaction-row" key={tx.id}><span className={`tx-symbol ${tx.kind}`}>{tx.kind==='income'?<ArrowDownRight size={18}/>:<ArrowUpRight size={18}/>}</span><div className="tx-description"><b>{tx.title}</b><small>{tx.category} · {tx.date}</small></div><strong className={tx.kind==='income'?'positive':'amount'}>{tx.kind==='income'?'+':'−'}{money(tx.amount)}</strong><button className="icon-button delete" onClick={()=>deleteTx(tx)} title="Delete transaction"><X size={16}/></button></div>):<p className="empty">No transactions match your search.</p>}</div>
    {supabase&&user&&<div className="import-row"><p>Have transactions in the previous SmartSpend version?</p><button className="secondary" onClick={importOldTransactions}>Import old transactions</button></div>}
    </section><footer>SmartSpend <span>·</span> Your money, more mindful.</footer></section>
    {showAdd&&<div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setShowAdd(false)}}><motion.section initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="modal"><div className="modal-heading"><div><h2>Add transaction</h2><p className="muted">Record income or an expense.</p></div><button className="icon-button" onClick={()=>setShowAdd(false)}><X/></button></div><form className="form-stack" onSubmit={addTransaction}><label>Type<select value={kind} onChange={e=>setKind(e.target.value as 'income'|'expense')}><option value="expense">Expense</option><option value="income">Income</option></select></label><label>Description<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Lunch" required/></label><label>Category<select value={category} onChange={e=>setCategory(e.target.value)}>{['Food','Travel','Shopping','Bills','Education','Health','Entertainment','Income','Side income','Other'].map(c=><option key={c}>{c}</option>)}</select></label><label>Amount (₹)<input type="number" min="1" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0" required/></label><label>Date<input type="date" value={date} onChange={e=>setDate(e.target.value)} required/></label><button className="primary full">Save transaction</button></form></motion.section></div>}
    {showProfile&&<div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setShowProfile(false)}}><motion.section initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="modal profile-modal"><div className="modal-heading"><h2>Your profile</h2><button className="icon-button" onClick={()=>setShowProfile(false)}><X/></button></div><div className="profile-hero"><span className="avatar large">{(user?.user_metadata?.full_name||user?.email||'S').slice(0,1).toUpperCase()}</span><h3>{user?.user_metadata?.full_name||'SmartSpend user'}</h3><p className="muted">{user?.email||'Local preview account'}</p></div><div className="profile-detail"><span>Account status</span><b>{user?'Signed in':'Local preview'}</b></div><div className="profile-detail"><span>Storage</span><b>{supabase?'Supabase cloud':'This browser only'}</b></div>{user&&supabase?<button className="danger full" onClick={async()=>{await supabase.auth.signOut();setShowProfile(false);}}> <LogOut size={17}/> Log out</button>:<p className="muted small-note">Configure Supabase to enable user accounts and cloud storage.
   </p>}</motion.section></div>}
   </main>;
   }
