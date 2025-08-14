'use client';
import { useEffect, useState } from 'react';
type Word = { id:number, term:string, meaning:string, imageUrl?:string, audioUrl?:string };
type Course = { id:number, title:string, mode:string };
function genId(){ if (typeof window==='undefined') return 'anon'; let id=localStorage.getItem('anonId'); if(!id){id='anon-'+Math.random().toString(36).slice(2,9); localStorage.setItem('anonId',id);} return id; }
export default function WordBlitz(){ 
  const [word,setWord]=useState<Word|null>(null); const [choices,setChoices]=useState<string[]>([]);
  const [score,setScore]=useState(0); const [streak,setStreak]=useState(0); const [courses,setCourses]=useState<Course[]>([]); const [courseId,setCourseId]=useState<number|null>(null);
  const userId=genId();
  useEffect(()=>{ fetch('/api/courses').then(r=>r.json()).then(d=>{ setCourses(d.courses); const cb=d.courses.find((c:any)=>c.mode==='word-blitz'); if(cb) setCourseId(cb.id); }); },[]);
  async function load(){ const q = courseId?`?courseId=${courseId}&userId=${userId}`:`?userId=${userId}`; const res=await fetch('/api/play/next'+q,{cache:'no-store'}); const data=await res.json(); if(data.type==='word'){ setWord(data.word); setChoices(data.choices); if(!data.word.audioUrl) speak(data.word.term); else { const a=new Audio(data.word.audioUrl); a.play().catch(()=>speak(data.word.term)); } } }
  useEffect(()=>{ if(courseId!==null) load(); },[courseId]);
  const speak=(text:string)=>{ if(!('speechSynthesis' in window)) return; const u=new SpeechSynthesisUtterance(text); window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); }
  async function handlePick(m:string){ if(!word) return; const ok = m===word.meaning; setScore(s=>s + (ok?10+streak:-2)); setStreak(s=>ok?s+1:0); await fetch('/api/answer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ userId, type:'word', id: word.id, ok })}); setTimeout(load,500); }
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="badge">Score: {score}</div>
        <div className="badge">Streak: {streak}</div>
      </div>
      <div className="mt-4">
        <label className="text-sm text-gray-500 mr-2">选择课程：</label>
        <select value={courseId ?? ''} onChange={(e)=>setCourseId(Number(e.target.value))} className="border px-2 py-1 rounded">
          <option value="">默认</option>
          {courses.map(c=><option key={c.id} value={c.id}>{c.title} ({c.mode})</option>)}
        </select>
      </div>
      <div className="mt-6 text-center">
        {word?.imageUrl && <img src={word.imageUrl} alt={word?.term} className="mx-auto rounded-md mb-4 w-48 h-48 object-cover" />}
        <div className="text-4xl font-bold tracking-wide">{word?.term ?? '...'}</div>
        <p className="text-gray-500 text-sm mt-2">选择正确的中文释义</p>
        <div className="mt-2"><button className="btn btn-ghost" onClick={()=>word && (word.audioUrl ? new Audio(word.audioUrl).play() : speak(word.term))}>🔊 播放</button></div>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-6">
        {choices.map(c=> <button key={c} onClick={()=>handlePick(c)} className="btn btn-ghost text-left">{c}</button>)}
      </div>
    </div>
  );
}
