'use client';
import { useEffect, useState, useCallback } from 'react';
type Item = { id:number, prompt:string, answer:string, tokens:string[] };
function genId(){ if (typeof window==='undefined') return 'anon'; let id=localStorage.getItem('anonId'); if(!id){id='anon-'+Math.random().toString(36).slice(2,9); localStorage.setItem('anonId',id);} return id; }
export default function SentenceBuilder(){
  const [item,setItem]=useState<Item|null>(null); const [pool,setPool]=useState<string[]>([]); const [selected,setSelected]=useState<string[]>([]); const [result,setResult]=useState<'idle'|'right'|'wrong'>('idle'); const [courses,setCourses]=useState<any[]>([]); const [courseId,setCourseId]=useState<number|null>(null); const [progressPercent,setProgressPercent]=useState(0); const userId=genId();
  useEffect(()=>{ fetch('/api/courses').then(r=>r.json()).then(d=>{ setCourses(d.courses); const cs=d.courses.find((c:any)=>c.mode==='sentence-builder'); if(cs) setCourseId(cs.id); }); },[]);
  const load=async()=>{ const q = courseId?`?courseId=${courseId}&userId=${userId}`:`?userId=${userId}`; const res=await fetch('/api/play/next'+q,{cache:'no-store'}); const data=await res.json(); if(data.type==='item'){ setItem(data.item); setPool(shuffle(data.item.tokens||[])); setSelected([]); setResult('idle'); } };
  useEffect(()=>{ if(courseId!==null) load(); },[courseId]);
  const onKey = useCallback((e:KeyboardEvent)=>{ if(e.key===' '||e.code==='Space'){ e.preventDefault(); if(pool.length) pick(pool[0],0);} else if(e.key==='Enter'){ e.preventDefault(); submit(); } else if(e.key==='Backspace'){ e.preventDefault(); back(); } },[pool,selected,item]);
  useEffect(()=>{ window.addEventListener('keydown', onKey); return ()=>window.removeEventListener('keydown', onKey); },[onKey]);
  const pick=(t:string,i:number)=>{ setSelected(s=>[...s,t]); setPool(p=>p.filter((_,idx)=>idx!==i)); };
  const back=()=>{ setSelected(s=>{ if(!s.length) return s; const last=s[s.length-1]; setPool(p=>[...p,last]); return s.slice(0,-1); }); };
  const submit=async()=>{ if(!item) return; const ans = selected.join(' ').replace(/\s+([,.!?;:])/g,'$1'); const ok = ans.toLowerCase()===item.answer.toLowerCase(); setResult(ok?'right':'wrong'); await fetch('/api/answer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ userId, type:'item', id:item.id, ok })}); if(!ok){ setTimeout(()=>{ setSelected(item.answer.split(' ')); },600); } else { setTimeout(()=>load(),600); } };
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="text-sm">选择课程：<select value={courseId ?? ''} onChange={(e)=>setCourseId(Number(e.target.value))} className="ml-2 border px-2 py-1 rounded"><option value=''>默认</option>{courses.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select></div>
        <div className="text-sm">进度：<span className="font-medium">{Math.round(progressPercent)}%</span></div>
      </div>
      <div className="w-full h-3 bg-gray-200 rounded-full mt-4"><div className="h-3 bg-green-500 rounded-full" style={{width:`${progressPercent}%`}}></div></div>
      <div className="mt-4 text-sm text-gray-500">提示：{item?.prompt}</div>
      <div className="mt-4 min-h-16 border rounded-lg p-3 bg-gray-50">{selected.map((t,i)=><span key={i} className="badge mr-2 mb-2">{t}</span>)}</div>
      <div className="mt-4 flex flex-wrap gap-2">{pool.map((t,i)=><button key={i} className="btn btn-ghost" onClick={()=>pick(t,i)}>{t}</button>)}</div>
      <div className="mt-4 flex gap-3"><button className="btn btn-ghost" onClick={back}>撤销 (Backspace)</button><button className="btn btn-primary" onClick={submit}>提交 (Enter)</button></div>
      <div className="mt-3">{result==='right'&&<div className="text-green-600">✅ 正确！</div>}{result==='wrong'&&<div className="text-red-600">❌ 再试一次。</div>}</div>
      <div className="mt-3 text-xs text-gray-500">快捷键：空格 = 选取第一个词块，回车 = 提交，Backspace = 撤销</div>
    </div>
  );
}
function shuffle<T>(arr:T[]):T[]{ const a=[...arr]; for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
