import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Dumbbell, HeartPulse, BarChart3, Settings, CalendarDays, CheckCircle2, Trash2, Download, Sun, Moon } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const LS_KEY = "training_app_data_v1";
const THEME_KEY = "training_app_theme";

const defaultExercises = ["Bänkpress","Knäböj","Marklyft","Militärpress","Hantelrodd"];
const defaultCardioTypes = ["Löpning","Cykling","Rodd","Promenad"];

function cryptoRandomId(){return(crypto?.randomUUID?.()||Math.random().toString(36).slice(2));}

function sampleSeed(){return{exercises:defaultExercises,cardioTypes:defaultCardioTypes,entries:[],goals:{strength:{exercise:"Bänkpress",targetWeight:100},cardio:{type:"Löpning",target5kMin:25}},unit:{weight:"kg",distance:"km"}};}
function loadData(){try{const raw=localStorage.getItem(LS_KEY);return raw?JSON.parse(raw):sampleSeed()}catch(e){return sampleSeed()}}
function saveData(d){localStorage.setItem(LS_KEY,JSON.stringify(d));}

function loadTheme(){return localStorage.getItem(THEME_KEY)||"light";}
function saveTheme(t){localStorage.setItem(THEME_KEY,t);}

function classNames(...c){return c.filter(Boolean).join(" ");}
function formatDateISO(d){return new Date(d).toISOString().slice(0,10);}
function startOfWeek(dt){const d=new Date(dt);const w=(d.getDay()+6)%7;d.setDate(d.getDate()-w);d.setHours(0,0,0,0);return d;}
function endOfWeek(dt){const d=startOfWeek(dt);d.setDate(d.getDate()+7);return d;}

export default function TrainingApp(){
  const [tab,setTab]=useState("home");
  const [data,setData]=useState(loadData);
  const [theme,setTheme]=useState(loadTheme);

  useEffect(()=>saveData(data),[data]);
  useEffect(()=>{document.documentElement.classList.toggle("dark",theme==="dark");saveTheme(theme);},[theme]);

  const now=new Date();
  const ws=startOfWeek(now), we=endOfWeek(now);
  const weekEntries=data.entries.filter(e=>new Date(e.date)>=ws && new Date(e.date)<we);
  const weekSessions=weekEntries.length;
  const weekVol=weekEntries.filter(e=>e.type==="strength").reduce((s,e)=>s+(e.weight*e.reps*e.sets),0);
  const weekCardio=weekEntries.filter(e=>e.type==="cardio").reduce((s,e)=>s+e.durationMin,0);

  const chartStrength=useMemo(()=>{const map={};data.entries.filter(e=>e.type==="strength").forEach(e=>{const k=formatDateISO(e.date);map[k]=(map[k]||0)+e.weight*e.reps*e.sets});return Object.entries(map).map(([date,volume])=>({date,volume}))},[data.entries]);
  const chartCardio=useMemo(()=>data.entries.filter(e=>e.type==="cardio"&&e.name==="Löpning"&&e.distanceKm&&e.durationMin).sort((a,b)=>new Date(a.date)-new Date(b.date)).map(e=>({date:formatDateISO(e.date),pace:+(e.durationMin/e.distanceKm).toFixed(2)})),[data.entries]);

  return(
    <div className={classNames("min-h-screen font-sans transition-colors", theme==="dark"?"bg-gray-900 text-gray-100":"bg-gray-100 text-gray-900")}> 
      <header className={classNames("sticky top-0 z-10 shadow-md", theme==="dark"?"bg-gray-800 text-white":"bg-gray-900 text-white")}> 
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">
            <Dumbbell className="w-6 h-6 text-indigo-400"/>
            <span>Min Träning</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>setTheme(theme==="dark"?"light":"dark")} className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-white">
              {theme==="dark"?<Sun className="w-5 h-5"/>:<Moon className="w-5 h-5"/>}
            </button>
            <nav className="flex gap-2">
              <TabButton active={tab==="home"} onClick={()=>setTab("home")} label="Hem" icon={<CalendarDays className="w-4 h-4"/>} theme={theme}/>
              <TabButton active={tab==="log"} onClick={()=>setTab("log")} label="Logga" icon={<Plus className="w-4 h-4"/>} theme={theme}/>
              <TabButton active={tab==="stats"} onClick={()=>setTab("stats")} label="Statistik" icon={<BarChart3 className="w-4 h-4"/>} theme={theme}/>
              <TabButton active={tab==="settings"} onClick={()=>setTab("settings")} label="Inställningar" icon={<Settings className="w-4 h-4"/>} theme={theme}/>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {tab==="home" && (
          <>
            <WeeklySummary sessions={weekSessions} volume={weekVol} cardioMin={weekCardio} theme={theme}/>
            <div className="grid md:grid-cols-2 gap-6">
              <Card title="Senaste pass" theme={theme}>
                {data.entries.slice().sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,6).map(e=>(<EntryRow key={e.id} e={e} theme={theme}/>))}
              </Card>
              <Card title="Snabböversikt" theme={theme}>
                <div className="h-48">
                  <ChartTitle theme={theme}>Veckovolym (styrka)</ChartTitle>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartStrength}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date"/><YAxis/><Tooltip/><Bar dataKey="volume" fill="#6366f1"/></BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="h-48 mt-6">
                  <ChartTitle theme={theme}>Löpning – tempo (min/km)</ChartTitle>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartCardio}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date"/><YAxis reversed/><Tooltip/><Line type="monotone" dataKey="pace" stroke="#10b981" dot/></LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </>
        )}
        {tab==="log" && (
          <div className="grid md:grid-cols-2 gap-6">
            <Card title="Logga styrka" theme={theme}>Här kommer formuläret senare</Card>
            <Card title="Logga kondition" theme={theme}>Här kommer formuläret senare</Card>
          </div>
        )}
      </main>

      <footer className={classNames("text-center py-4 text-xs", theme==="dark"?"text-gray-400":"text-gray-500")}>Data sparas lokalt i webbläsaren</footer>
    </div>
  );
}

function TabButton({active,onClick,icon,label,theme}){
  return(
    <button onClick={onClick} className={classNames("inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors", active?"bg-indigo-500 text-white":theme==="dark"?"bg-gray-700 text-gray-300 hover:bg-gray-600":"bg-gray-800 text-gray-300 hover:bg-gray-700")}>{icon}<span className="hidden sm:inline">{label}</span></button>
  );
}

function Card({title,children,theme}){
  return(
    <div className={classNames("rounded-2xl p-4 shadow-md border", theme==="dark"?"bg-gray-800 border-gray-700":"bg-white border-gray-200")}> 
      {title && <h3 className="font-semibold mb-4 border-b pb-2" >{title}</h3>}
      {children}
    </div>
  );
}

function WeeklySummary({sessions,volume,cardioMin,theme}){
  const stats=[{label:"Pass denna vecka",val:sessions,icon:<CheckCircle2 className="w-5 h-5"/>},{label:"Volym styrka",val:volume,suffix:"kg",icon:<Dumbbell className="w-5 h-5"/>},{label:"Konditionstid",val:cardioMin,suffix:"min",icon:<HeartPulse className="w-5 h-5"/>}];
  return(
    <div className="grid md:grid-cols-3 gap-4">
      {stats.map((s,i)=>(
        <motion.div key={i} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}} className={classNames("rounded-2xl p-4 shadow border", theme==="dark"?"bg-gray-800 border-gray-700":"bg-white border-gray-200")}>
          <div className={classNames("flex items-center gap-2", theme==="dark"?"text-gray-300":"text-gray-600")}>{s.icon}<span>{s.label}</span></div>
          <div className="text-2xl font-bold mt-1">{s.val} {s.suffix||""}</div>
        </motion.div>
      ))}
    </div>
  );
}

function EntryRow({e,theme}){
  return(
    <div className={classNames("py-3 border-b last:border-0 text-sm", theme==="dark"?"border-gray-700":"border-gray-200")}> 
      <div className={classNames("text-xs", theme==="dark"?"text-gray-400":"text-gray-500")}>{formatDateISO(e.date)}</div>
      {e.type==="strength"?(<div className="font-medium">{e.name} – {e.weight}kg × {e.reps} × {e.sets}</div>):(<div className="font-medium">{e.name} – {e.distanceKm} km • {e.durationMin} min</div>)}
      {e.notes && <div className={classNames("italic", theme==="dark"?"text-gray-400":"text-gray-600")}>{e.notes}</div>}
    </div>
  );
}

function ChartTitle({children,theme}){
  return(<div className={classNames("text-xs mb-1", theme==="dark"?"text-gray-400":"text-gray-500")}>{children}</div>);
}
