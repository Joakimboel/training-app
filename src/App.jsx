import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Dumbbell, HeartPulse, BarChart3, Settings, CalendarDays, CheckCircle2, Sun, Moon, Trash2 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, LineChart, Line } from "recharts";

const LS_KEY = "training_app_data_v1";
const THEME_KEY = "training_app_theme";

// ===== Demo Data =====
const defaultExercises = ["Bänkpress","Knäböj","Marklyft","Militärpress","Hantelrodd"];
const defaultCardioTypes = ["Löpning","Cykling","Rodd","Promenad"];

function sampleSeed(){
  return {
    exercises: defaultExercises,
    cardioTypes: defaultCardioTypes,
    entries: [],
  };
}

function loadData(){
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : sampleSeed();
  } catch {
    return sampleSeed();
  }
}
function saveData(d){ localStorage.setItem(LS_KEY, JSON.stringify(d)); }

function loadTheme(){ return localStorage.getItem(THEME_KEY) || "light"; }
function saveTheme(t){ localStorage.setItem(THEME_KEY, t); }

function classNames(...c){ return c.filter(Boolean).join(" "); }
function formatDateISO(d){ return new Date(d).toISOString().slice(0,10); }

export default function App() {
  const [tab, setTab] = useState("home");
  const [data, setData] = useState(loadData);
  const [theme, setTheme] = useState(loadTheme);

  // ---- for forms ----
  const [strengthForm, setStrengthForm] = useState({date: new Date().toISOString(), name: defaultExercises[0], weight:"", reps:"", sets:"", notes:""});
  const [cardioForm, setCardioForm] = useState({date: new Date().toISOString(), name: defaultCardioTypes[0], distanceKm:"", durationMin:"", avgHr:"", notes:""});

  useEffect(() => saveData(data), [data]);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    saveTheme(theme);
  }, [theme]);

  // ===== Weekly Stats =====
  const now = new Date();
  const ws = new Date(now.setDate(now.getDate() - now.getDay() + 1));
  const we = new Date(ws.getTime() + 7*24*60*60*1000);
  const weekEntries = data.entries.filter(e => new Date(e.date) >= ws && new Date(e.date) < we);
  const weekSessions = weekEntries.length;
  const weekVol = weekEntries.filter(e=>e.type==="strength").reduce((s,e)=>s+(e.weight*e.reps*e.sets),0);
  const weekCardio = weekEntries.filter(e=>e.type==="cardio").reduce((s,e)=>s+e.durationMin,0);

  const chartStrength = useMemo(()=>{
    const map = {};
    data.entries.filter(e=>e.type==="strength").forEach(e=>{
      const k = formatDateISO(e.date);
      map[k] = (map[k] || 0) + (e.weight*e.reps*e.sets);
    });
    return Object.entries(map).map(([date, volume]) => ({ date, volume }));
  }, [data.entries]);

  const chartCardio = useMemo(()=>{
    return data.entries
      .filter(e=>e.type==="cardio" && e.name==="Löpning" && e.distanceKm && e.durationMin)
      .sort((a,b)=> new Date(a.date) - new Date(b.date))
      .map(e => ({ date: formatDateISO(e.date), pace: +(e.durationMin / e.distanceKm).toFixed(2) }));
  }, [data.entries]);

  // ===== Handlers =====
  const addStrength = () => {
    if(!strengthForm.name || !strengthForm.weight || !strengthForm.reps || !strengthForm.sets) return;
    const newEntry = {
      type: "strength",
      date: strengthForm.date,
      name: strengthForm.name,
      weight: +strengthForm.weight,
      reps: +strengthForm.reps,
      sets: +strengthForm.sets,
      notes: strengthForm.notes
    };
    setData({...data, entries:[...data.entries,newEntry]});
    setStrengthForm({date:new Date().toISOString(),name:defaultExercises[0],weight:"",reps:"",sets:"",notes:""});
    setTab("home");
  };

  const addCardio = () => {
    if(!cardioForm.name || !cardioForm.distanceKm || !cardioForm.durationMin) return;
    const newEntry = {
      type: "cardio",
      date: cardioForm.date,
      name: cardioForm.name,
      distanceKm: +cardioForm.distanceKm,
      durationMin: +cardioForm.durationMin,
      avgHr: cardioForm.avgHr ? +cardioForm.avgHr : undefined,
      notes: cardioForm.notes
    };
    setData({...data, entries:[...data.entries,newEntry]});
    setCardioForm({date:new Date().toISOString(),name:defaultCardioTypes[0],distanceKm:"",durationMin:"",avgHr:"",notes:""});
    setTab("home");
  };

  const deleteEntry = (idx) => {
    setData({...data, entries: data.entries.filter((_,i)=>i!==idx)});
  };

  return (
    <div className={classNames("min-h-screen font-sans", theme==="dark" ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900")}>
      {/* Header */}
      <header className={classNames("sticky top-0 z-10 shadow-md", theme==="dark" ? "bg-gray-800 text-white" : "bg-gray-900 text-white")}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">
            <Dumbbell className="w-6 h-6 text-indigo-400" />
            <span>Min Träning</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>setTheme(theme==="dark" ? "light" : "dark")} className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-white">
              {theme==="dark" ? <Sun className="w-5 h-5"/> : <Moon className="w-5 h-5"/>}
            </button>
            <nav className="flex gap-2">
              <TabButton active={tab==="home"} onClick={()=>setTab("home")} label="Hem" icon={<CalendarDays className="w-4 h-4" />} theme={theme}/>
              <TabButton active={tab==="log"} onClick={()=>setTab("log")} label="Logga" icon={<Plus className="w-4 h-4" />} theme={theme}/>
              <TabButton active={tab==="stats"} onClick={()=>setTab("stats")} label="Statistik" icon={<BarChart3 className="w-4 h-4" />} theme={theme}/>
              <TabButton active={tab==="settings"} onClick={()=>setTab("settings")} label="Inställningar" icon={<Settings className="w-4 h-4" />} theme={theme}/>
            </nav>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {tab==="home" && (
          <>
            <WeeklySummary sessions={weekSessions} volume={weekVol} cardioMin={weekCardio} theme={theme}/>
            <div className="grid md:grid-cols-2 gap-6">
              <Card title="Senaste pass" theme={theme}>
                {data.entries.length === 0 && <div className="text-sm text-gray-500">Inga pass än</div>}
                {data.entries.slice().reverse().slice(0,6).map((e,i)=>
                  <EntryRow key={i} e={e} theme={theme} onDelete={()=>deleteEntry(data.entries.length-1-i)} />
                )}
              </Card>
              <Card title="Snabböversikt" theme={theme}>
                <div className="h-48">
                  <ChartTitle theme={theme}>Veckovolym (styrka)</ChartTitle>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartStrength}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="volume" fill="#6366f1" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="h-48 mt-6">
                  <ChartTitle theme={theme}>Löpning – tempo (min/km)</ChartTitle>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartCardio}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis reversed />
                      <Tooltip />
                      <Line type="monotone" dataKey="pace" stroke="#10b981" dot />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </>
        )}
        {tab==="log" && (
          <div className="grid md:grid-cols-2 gap-6">
            <Card title="Logga styrkepass" theme={theme}>
              <form onSubmit={(e)=>{e.preventDefault();addStrength();}} className="space-y-3">
                <label className="block">
                  <span className="text-sm">Datum</span>
                  <input type="date" value={formatDateISO(strengthForm.date)} onChange={e=>setStrengthForm({...strengthForm,date:new Date(e.target.value).toISOString()})} className="w-full p-2 rounded border mt-1" />
                </label>
                <label className="block">
                  <span className="text-sm">Övning</span>
                  <select value={strengthForm.name} onChange={e=>setStrengthForm({...strengthForm,name:e.target.value})} className="w-full p-2 rounded border mt-1">
                    {data.exercises.map(x=><option key={x}>{x}</option>)}
                  </select>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <input type="number" placeholder="Vikt kg" value={strengthForm.weight} onChange={e=>setStrengthForm({...strengthForm,weight:e.target.value})} className="p-2 rounded border"/>
                  <input type="number" placeholder="Reps" value={strengthForm.reps} onChange={e=>setStrengthForm({...strengthForm,reps:e.target.value})} className="p-2 rounded border"/>
                  <input type="number" placeholder="Set" value={strengthForm.sets} onChange={e=>setStrengthForm({...strengthForm,sets:e.target.value})} className="p-2 rounded border"/>
                </div>
                <input type="text" placeholder="Anteckning (valfritt)" value={strengthForm.notes} onChange={e=>setStrengthForm({...strengthForm,notes:e.target.value})} className="w-full p-2 rounded border"/>
                <button type="submit" className="px-4 py-2 rounded bg-indigo-600 text-white">Spara styrkepass</button>
              </form>
            </Card>
            <Card title="Logga konditionspass" theme={theme}>
              <form onSubmit={(e)=>{e.preventDefault();addCardio();}} className="space-y-3">
                <label className="block">
                  <span className="text-sm">Datum</span>
                  <input type="date" value={formatDateISO(cardioForm.date)} onChange={e=>setCardioForm({...cardioForm,date:new Date(e.target.value).toISOString()})} className="w-full p-2 rounded border mt-1" />
                </label>
                <label className="block">
                  <span className="text-sm">Typ</span>
                  <select value={cardioForm.name} onChange={e=>setCardioForm({...cardioForm,name:e.target.value})} className="w-full p-2 rounded border mt-1">
                    {data.cardioTypes.map(x=><option key={x}>{x}</option>)}
                  </select>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <input type="number" step="0.1" placeholder="Distans km" value={cardioForm.distanceKm} onChange={e=>setCardioForm({...cardioForm,distanceKm:e.target.value})} className="p-2 rounded border"/>
                  <input type="number" step="0.1" placeholder="Tid min" value={cardioForm.durationMin} onChange={e=>setCardioForm({...cardioForm,durationMin:e.target.value})} className="p-2 rounded border"/>
                  <input type="number" placeholder="Puls (valfritt)" value={cardioForm.avgHr} onChange={e=>setCardioForm({...cardioForm,avgHr:e.target.value})} className="p-2 rounded border"/>
                </div>
                <input type="text" placeholder="Anteckning (valfritt)" value={cardioForm.notes} onChange={e=>setCardioForm({...cardioForm,notes:e.target.value})} className="w-full p-2 rounded border"/>
                <button type="submit" className="px-4 py-2 rounded bg-indigo-600 text-white">Spara konditionspass</button>
              </form>
            </Card>
          </div>
        )}
      </main>

      <footer className={classNames("text-center py-4 text-xs", theme==="dark" ? "text-gray-400" : "text-gray-500")}>
        Data sparas lokalt i webbläsaren
      </footer>
    </div>
  );
}

// ===== UI Components =====
function TabButton({active,onClick,icon,label,theme}){
  return (
    <button onClick={onClick} className={classNames(
      "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors",
      active
        ? "bg-indigo-500 text-white"
        : theme==="dark" ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
    )}>
      {icon} <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function Card({title,children,theme}){
  return (
    <div className={classNames("rounded-2xl p-4 shadow-md border space-y-3", theme==="dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200")}>
      {title && <h3 className="font-semibold mb-2">{title}</h3>}
      {children}
    </div>
  );
}

function WeeklySummary({sessions,volume,cardioMin,theme}){
  const stats = [
    {label:"Pass denna vecka",val:sessions,icon:<CheckCircle2 className="w-5 h-5" />},
    {label:"Volym styrka",val:volume,suffix:"kg",icon:<Dumbbell className="w-5 h-5" />},
    {label:"Konditionstid",val:cardioMin,suffix:"min",icon:<HeartPulse className="w-5 h-5" />}
  ];
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {stats.map((s,i)=>(
        <motion.div key={i} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
          className={classNames("rounded-2xl p-4 shadow border", theme==="dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200")}>
          <div className={classNames("flex items-center gap-2", theme==="dark" ? "text-gray-300" : "text-gray-600")}>
            {s.icon} <span>{s.label}</span>
          </div>
          <div className="text-2xl font-bold mt-1">{s.val} {s.suffix||""}</div>
        </motion.div>
      ))}
    </div>
  );
}

function EntryRow({e,theme,onDelete}){
  return (
    <div className={classNames("py-3 border-b last:border-0 text-sm flex justify-between items-start", theme==="dark" ? "border-gray-700" : "border-gray-200")}>
      <div>
        <div className={classNames("text-xs", theme==="dark" ? "text-gray-400" : "text-gray-500")}>{formatDateISO(e.date)}</div>
        {e.type==="strength"
          ? <div className="font-medium">{e.name} – {e.weight}kg × {e.reps} × {e.sets}</div>
          : <div className="font-medium">{e.name} – {e.distanceKm} km • {e.durationMin} min{e.avgHr ? ` • ${e.avgHr} bpm` : ""}</div>}
        {e.notes && <div className={classNames("italic text-sm", theme==="dark" ? "text-gray-400" : "text-gray-600")}>{e.notes}</div>}
      </div>
      <button onClick={onDelete} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
    </div>
  );
}

function ChartTitle({children,theme}){
  return <div className={classNames("text-xs mb-1", theme==="dark" ? "text-gray-400" : "text-gray-500")}>{children}</div>;
}
