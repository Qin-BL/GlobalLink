import { NextResponse } from 'next/server';
const items = [
  { id: 1, prompt: '他昨天去了图书馆。', answer: 'He went to the library yesterday.', tokens: ['He','went','to','the','library','yesterday','.'] },
  { id: 2, prompt: '请把门关上。', answer: 'Please close the door.', tokens: ['Please','close','the','door','.'] },
  { id: 3, prompt: '我正在等公交车。', answer: 'I am waiting for the bus.', tokens: ['I','am','waiting','for','the','bus','.'] }
];
export async function GET(){ const idx=Math.floor(Math.random()*items.length); return NextResponse.json({ item: items[idx] }); }
