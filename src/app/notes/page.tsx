'use client';
// @ts-nocheck

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';

interface NoteImage { url: string; key: string; }
interface NoteItem { _id: string; title: string; content: string; images: NoteImage[]; createdAt: string; updatedAt: string; }
interface NotesData { items: NoteItem[]; total: number; page: number; limit: number; totalPages: number; }

const NOTE_COLORS = [
  {bg:'bg-yellow-100',border:'border-yellow-300',shadow:'shadow-yellow-200/50',dark:'text-yellow-800',accent:'#FDE68A'},
  {bg:'bg-pink-100',border:'border-pink-300',shadow:'shadow-pink-200/50',dark:'text-pink-800',accent:'#F9A8D4'},
  {bg:'bg-blue-100',border:'border-blue-300',shadow:'shadow-blue-200/50',dark:'text-blue-800',accent:'#93C5FD'},
  {bg:'bg-green-100',border:'border-green-300',shadow:'shadow-green-200/50',dark:'text-green-800',accent:'#86EFAC'},
  {bg:'bg-purple-100',border:'border-purple-300',shadow:'shadow-purple-200/50',dark:'text-purple-800',accent:'#C4B5FD'},
  {bg:'bg-orange-100',border:'border-orange-300',shadow:'shadow-orange-200/50',dark:'text-orange-800',accent:'#FDBA74'},
  {bg:'bg-cyan-100',border:'border-cyan-300',shadow:'shadow-cyan-200/50',dark:'text-cyan-800',accent:'#67E8F9'},
  {bg:'bg-rose-100',border:'border-rose-300',shadow:'shadow-rose-200/50',dark:'text-rose-800',accent:'#FDA4AF'},
  {bg:'bg-indigo-100',border:'border-indigo-300',shadow:'shadow-indigo-200/50',dark:'text-indigo-800',accent:'#A5B4FC'},
  {bg:'bg-emerald-100',border:'border-emerald-300',shadow:'shadow-emerald-200/50',dark:'text-emerald-800',accent:'#6EE7B7'},
];
const ROTS = ['-rotate-1','rotate-1','-rotate-2','rotate-2','-rotate-0.5','rotate-0.5'];
function getStyle(i: number){return{color:NOTE_COLORS[i%NOTE_COLORS.length],rot:ROTS[i%ROTS.length]};}

export default function NotesPage(){
  const {user,loading}=useAuth();
  const[n,sN]=useState<NoteItem[]>([]);const[f,sF]=useState(true);
  const[se,sSe]=useState('');const[si,sSi]=useState('');
  const[pg,sPg]=useState(1);const[tp,sTp]=useState(1);const[tt,sTt]=useState(0);
  const[vc,sVc]=useState<Set<string>>(new Set);
  const[sm,sSm]=useState(false);const[ei,sEi]=useState<NoteItem|null>(null);
  const[ft,sFt]=useState('');const[fc,sFc]=useState('');const[fi,sFi]=useState<NoteImage[]>([]);
  const[up,sUp]=useState(false);const[sv,sSv]=useState(false);
  const fir=useRef<HTMLInputElement>(null);
  const[li,sLi]=useState<string|null>(null);const[zm,sZm]=useState(1);const[pn,sPn]=useState({x:0,y:0});
  const[di,sDi]=useState<string|null>(null);
  const ob=useRef<IntersectionObserver|null>(null);const cr=useRef<Map<string,HTMLDivElement>>(new Map);
  const fn=useCallback(async()=>{sF(true);sVc(new Set);
    try{const p=new URLSearchParams({page:String(pg),limit:'50'});if(se)p.set('search',se);const r=await fetch('/api/notes?'+p.toString());const j=await r.json();if(j.success){const d=j.data;sN(d.items);sTp(d.totalPages);sTt(d.total);}}catch{}finally{sF(false);}},[pg,se]);
  useEffect(()=>{if(user)fn();},[user,fn]);
  useEffect(()=>{if(ob.current)ob.current.disconnect();
    ob.current=new IntersectionObserver((es)=>{es.forEach((e)=>{if(e.isIntersecting){const id=e.target.getAttribute('data-id');if(id)sVc((p)=>new Set(p).add(id));ob.current?.unobserve(e.target);}});},{threshold:0.1,rootMargin:'0px 0px -50px 0px'});
    cr.current.forEach((el)=>{if(ob.current)ob.current.observe(el);});return()=>ob.current?.disconnect();},[n]);
  const sr=(id:string,el:HTMLDivElement|null)=>{if(el){cr.current.set(id,el);if(ob.current)ob.current.observe(el);}else{cr.current.delete(id);}};
  const hs=(e: React.FormEvent)=>{e.preventDefault();sPg(1);sSe(si);sVc(new Set);};
  const oa=()=>{sEi(null);sFt('');sFc('');sFi([]);sSm(true);};
  const oe=(item: NoteItem)=>{sEi(item);sFt(item.title||'');sFc(item.content||'');sFi(item.images||[]);sSm(true);};
  const hi=async(e: React.ChangeEvent<HTMLInputElement>)=>{const fl=e.target.files;if(!fl||fl.length===0)return;sUp(true);
    try{for(let i=0;i<fl.length;i++){const f=fl[i];const fd=new FormData();fd.append('file',f);const r=await fetch('/api/notes/upload',{method:'POST',body:fd});const j=await r.json();if(j.success)sFi(p=>[...p,j.data]);}}catch{}finally{sUp(false);}if(fir.current)fir.current.value='';};
  const ri=(i: number)=>sFi(p=>p.filter((_,idx)=>idx!==i));
  const hsv=async(e: React.FormEvent)=>{e.preventDefault();if(!fc&&fi.length===0){alert('');return;}sSv(true);
    try{const b={title:ft,content:fc,images:fi};if(ei){await fetch('/api/notes/'+ei._id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});}else{await fetch('/api/notes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});}sSm(false);fn();}catch{}finally{sSv(false);}};
  const dn=async(id: string)=>{sDi(null);await fetch('/api/notes/'+id,{method:'DELETE'});fn();};
  const cl=()=>{sLi(null);sZm(1);sPn({x:0,y:0});};

  if(loading)return<div className="flex items-center justify-center min-h-[60vh]"><div className="w-12 h-12 border-[3px] border-yellow-300 border-t-pink-400 rounded-full animate-spin" /></div>;

  if(!user)return(<div className="max-w-3xl mx-auto px-4 py-20 text-center animate-fadeIn">
    <div className="inline-block p-4 bg-yellow-50 rounded-2xl shadow-sm mb-4 transform -rotate-1">
      <svg className="w-12 h-12 text-yellow-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    </div>
    <p className="text-gray-400 mb-4">请先登录</p>
    <a href="/login" className="inline-block px-6 py-2.5 bg-gradient-to-r from-yellow-400 to-pink-400 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:scale-105 transition-all duration-300">去登录</a>
  </div>);

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-yellow-500 via-pink-500 to-purple-500 bg-clip-text text-transparent flex items-center gap-2">记事本</h1>
        <button onClick={oa} className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-pink-400 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 min-h-[44px] flex items-center gap-1.5 shadow-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          新建
        </button>
      </div>
      <form onSubmit={hs} className="mb-5">
        <div className="relative group">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-pink-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" value={si} onChange={(e)=>sSi(e.target.value)} placeholder="搜索记事..." className="w-full pl-9 pr-4 py-3 bg-white/80 backdrop-blur border-2 border-yellow-200 rounded-2xl text-sm focus:outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-100 transition-all duration-300" />
        </div></form>
      {f?(<div className="flex justify-center py-20"><div className="flex flex-col items-center gap-3"><div className="w-10 h-10 border-[3px] border-yellow-300 border-t-pink-400 rounded-full animate-spin" /><p className="text-sm text-gray-400 animate-pulse">加载中...</p></div></div>):n.length===0?(<div className="text-center py-20 animate-fadeIn">
        <p className="text-gray-400 mb-2">{se?"没有找到匹配的记事":"还没有记事"}</p>
        <p className="text-gray-300 text-sm mb-4">{se?"试试其他关键词吧":"点击右上角创建一个"}</p>
        {!se&&<button onClick={oa} className="px-5 py-2 bg-gradient-to-r from-yellow-400 to-pink-400 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:scale-105 transition-all duration-300">创建第一条记事</button>}
      </div>):(<>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {n.map((note,idx)=>{
          const{color,rot}=getStyle(idx);const vis=vc.has(note._id);const hi=note.images&&note.images.length>0;const ih=hi&&note.images.length>=2;return(
            <div key={note._id} ref={(el)=>sr(note._id,el)} data-id={note._id}
              className={[rot,'transition-all duration-700 ease-out',vis?'opacity-100 translate-y-0':'opacity-0 translate-y-8'].join(' ')}
              style={{transitionDelay:Math.min(idx*80,500)+'ms'}}>
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 w-8 h-4 bg-gray-200/60 rounded-sm opacity-60 shadow-sm" />
              <div onClick={()=>oe(note)} className={[color.bg,'border-2',color.border,'rounded-2xl','overflow-hidden',color.shadow,'shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] group cursor-pointer'].join(' ')}>
                <div className="absolute -top-0.5 -right-0.5 w-6 h-6 bg-white/40 rounded-bl-2xl" />
                {hi&&(<div className={['relative',ih?'h-48 sm:h-56':'h-36 sm:h-40','overflow-hidden'].join(' ')}>
                  <div className="flex h-full">
                    {note.images.slice(0,3).map((img,i)=>(<button key={i} onClick={(e)=>{e.stopPropagation();sLi(img.url);}}
                      className={[note.images.length===1?'w-full':note.images.length===2?'w-1/2':i===0?'w-1/2':'w-1/4','overflow-hidden group/img transition-all duration-300'].join(' ')}>
                      <img src={img.url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110" />
                      {i===2&&note.images.length>3&&<div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold text-lg">+{note.images.length-3}</div>}
                    </button>))}
                  </div>
                  <div className={['absolute bottom-0 left-0 right-0 h-12','bg-gradient-to-t from-white/80 to-transparent'].join(' ')} />
                </div>)}
                <div className="p-3.5 sm:p-4">
                  {note.title&&<h3 className="font-bold text-sm sm:text-base truncate flex items-center gap-1.5"><span className={['inline-block w-2 h-2 rounded-full',color.dark.replace('text-','bg-')].join(' ')} />{note.title}</h3>}
                  {note.content&&<p className={['text-sm',note.title?'mt-1.5':'','text-gray-600','line-clamp-3','whitespace-pre-wrap','leading-relaxed'].join(' ')}>{note.content}</p>}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/50">
                    <span className="text-xs text-gray-400 flex items-center gap-1"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{new Date(note.createdAt).toLocaleDateString('zh-HK',{month:'short',day:'numeric'})}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                      <button onClick={(e)=>{e.stopPropagation();oe(note);}} className="p-1.5 rounded-lg bg-white/60 backdrop-blur text-gray-500 hover:text-pink-600 hover:bg-pink-50 transition-all duration-200 shadow-sm"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                      <button onClick={(e)=>{e.stopPropagation();sDi(note._id);}} className="p-1.5 rounded-lg bg-white/60 backdrop-blur text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all duration-200 shadow-sm"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );})}
      </div>
      {tp>1&&<div className="flex justify-center items-center gap-3 mt-8">
        <button onClick={()=>sPg(p=>Math.max(1,p-1))} disabled={pg===1} className="px-4 py-2 text-sm bg-white border-2 border-yellow-200 rounded-xl disabled:opacity-30 hover:border-pink-300 hover:shadow-md transition-all duration-300 flex items-center gap-1"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>上一页</button>
        <span className="text-sm font-medium text-gray-500 bg-yellow-50 px-3 py-1.5 rounded-xl border border-yellow-200">{pg}/{tp}</span>
        <button onClick={()=>sPg(p=>Math.min(tp,p+1))} disabled={pg===tp} className="px-4 py-2 text-sm bg-white border-2 border-yellow-200 rounded-xl disabled:opacity-30 hover:border-pink-300 hover:shadow-md transition-all duration-300 flex items-center gap-1">下一页<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg></button>
      </div>}
      </>)}
    </div>
  );
}