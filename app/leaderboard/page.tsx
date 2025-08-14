'use client';
import { useEffect, useState } from 'react';
export default function Leaderboard(){ const [rows,setRows]=useState<any[]>([]); useEffect(()=>{ fetch('/api/leaderboard').then(r=>r.json()).then(d=>setRows(d.leaderboard)); },[]); return (<div className="card"><h2 className="text-xl font-semibold">排行榜（Top 20）</h2><ol className="mt-4 space-y-2">{rows.map((r,i)=><li key={r.anonId} className="flex justify-between"><div>#{i+1} {r.anonId}</div><div>{r.points}</div></li>)}</ol></div>); }
