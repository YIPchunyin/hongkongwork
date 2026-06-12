'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';
import ImageEditorModal from '@/components/ImageEditorModal';

interface NoteImage { url: string; key: string; thumbUrl?: string; thumbKey?: string; }
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
  const[li,sLi]=useState<{url:string;images:{url:string;thumbUrl?:string}[];idx:number}|null>(null);const[zm,sZm]=useState(1);const[pn,sPn]=useState({x:0,y:0});
  const[di,sDi]=useState<string|null>(null);const[dv,sDv]=useState<NoteItem|null>(null);const[diIdx,sDiIdx]=useState(0);
  const[touchStartX,setTouchStartX]=useState(0);
  const handleDetailTouchStart=(e:React.TouchEvent)=>{setTouchStartX(e.touches[0].clientX);};
  const handleDetailTouchEnd=(e:React.TouchEvent)=>{if(!dv||!dv.images)return;const diff=e.changedTouches[0].clientX-touchStartX;if(Math.abs(diff)>50){if(diff<0&&diIdx<dv.images.length-1)sDiIdx(i=>i+1);if(diff>0&&diIdx>0)sDiIdx(i=>i-1);}};
  const[editingImgIdx,setEditingImgIdx]=useState<number|null>(null);
  const ob=useRef<IntersectionObserver|null>(null);const cr=useRef<Map<string,HTMLDivElement>>(new Map);
  const fn=useCallback(async()=>{sF(true);sVc(new Set);
    try{const p=new URLSearchParams({page:String(pg),limit:'50'});if(se)p.set('search',se);const r=await fetch('/api/notes?'+p.toString());const j=await r.json();if(j.success){const d=j.data;sN(d.items);sTp(d.totalPages);sTt(d.total);}}catch{}finally{sF(false);}},[pg,se]);
  useEffect(()=>{if(user)fn();},[user,fn]);
  useEffect(()=>{if(ob.current)ob.current.disconnect();
    ob.current=new IntersectionObserver((es)=>{es.forEach((e)=>{if(e.isIntersecting){const id=e.target.getAttribute('data-id');if(id)sVc((p)=>new Set(p).add(id));ob.current?.unobserve(e.target);}});},{threshold:0.1,rootMargin:'0px 0px -50px 0px'});
    cr.current.forEach((el)=>{if(ob.current)ob.current.observe(el);});return()=>ob.current?.disconnect();},[n]);
  const sr=(id:string,el:HTMLDivElement|null)=>{if(el){cr.current.set(id,el);if(ob.current)ob.current.observe(el);}else{cr.current.delete(id);}};
  const hs=(e:React.FormEvent)=>{e.preventDefault();sPg(1);sSe(si);sVc(new Set);};
  const oa=()=>{sEi(null);sFt('');sFc('');sFi([]);sSm(true);};
  const oe=(item:NoteItem)=>{sEi(item);sFt(item.title||'');sFc(item.content||'');sFi(item.images||[]);sSm(true);};
  const hi=async(e:React.ChangeEvent<HTMLInputElement>)=>{const fl=e.target.files;if(!fl||fl.length===0)return;sUp(true);
    try{for(let i=0;i<fl.length;i++){const f=fl[i];const fd=new FormData();fd.append('file',f);const r=await fetch('/api/notes/upload',{method:'POST',body:fd});const j=await r.json();if(j.success)sFi(p=>[...p,j.data]);}}catch{}finally{sUp(false);}if(fir.current)fir.current.value='';};
  const ri=(i:number)=>sFi(p=>p.filter((_,idx)=>idx!==i));
  const hsv=async(e:React.FormEvent)=>{e.preventDefault();if(!fc&&fi.length===0){alert('请输入内容或添加图片');return;}sSv(true);
    try{const b={title:ft,content:fc,images:fi};if(ei){await fetch('/api/notes/'+ei._id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});}else{await fetch('/api/notes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});}sSm(false);fn();}catch{}finally{sSv(false);}};
  const dn=async(id:string)=>{sDi(null);await fetch('/api/notes/'+id,{method:'DELETE'});fn();};
  const cl=()=>{sLi(null);sZm(1);sPn({x:0,y:0});};const goImg=(d:number)=>{if(!li)return;const n=li.idx+d;if(n<0||n>=li.images.length)return;sLi({...li,idx:n,url:li.images[n].url});sZm(1);sPn({x:0,y:0});};const lastTouchDist=useRef(0);const lastTouchPan=useRef({x:0,y:0});const lastTouchPos=useRef({x:0,y:0});const isPinching=useRef(false);
const handleTouchStart=(e:React.TouchEvent)=>{e.stopPropagation();if(e.touches.length===2){isPinching.current=true;const dx=e.touches[0].clientX-e.touches[1].clientX;const dy=e.touches[0].clientY-e.touches[1].clientY;lastTouchDist.current=Math.hypot(dx,dy);lastTouchPan.current={x:pn.x,y:pn.y};}else if(e.touches.length===1){lastTouchPos.current={x:e.touches[0].clientX,y:e.touches[0].clientY};lastTouchPan.current={x:pn.x,y:pn.y};}};
const handleTouchMove=(e:React.TouchEvent)=>{e.stopPropagation();if(e.touches.length===2&&isPinching.current){const dx=e.touches[0].clientX-e.touches[1].clientX;const dy=e.touches[0].clientY-e.touches[1].clientY;const dist=Math.hypot(dx,dy);const scale=dist/lastTouchDist.current;sZm(z=>Math.max(0.5,Math.min(5,z*scale)));lastTouchDist.current=dist;}else if(e.touches.length===1){const dx=e.touches[0].clientX-lastTouchPos.current.x;const dy=e.touches[0].clientY-lastTouchPos.current.y;sPn({x:lastTouchPan.current.x+dx,y:lastTouchPan.current.y+dy});}};
const handleTouchEnd=(e:React.TouchEvent)=>{isPinching.current=false;};
  const handleEditSave=async(dataUrl:string,idx:number)=>{setEditingImgIdx(null);
    try{const blob=await fetch(dataUrl).then(r=>r.blob());const fd=new FormData();fd.append('file',blob,'edited_'+Date.now()+'.jpg');
      const r=await fetch('/api/notes/upload',{method:'POST',body:fd});const j=await r.json();
      if(j.success)sFi(p=>{const c=[...p];c[idx]=j.data;return c;});}catch{}};

  if(loading)return<div className="flex items-center justify-center min-h-[60vh]"><div className="w-12 h-12 border-[3px] border-yellow-300 border-t-pink-400 rounded-full animate-spin" /></div>;

  if(!user)return(<div className="max-w-3xl mx-auto px-4 py-20 text-center animate-fadeIn">
    <div className="inline-block p-4 bg-yellow-50 rounded-2xl shadow-sm mb-4 transform -rotate-1">
      <svg className="w-12 h-12 text-yellow-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
      {editingImgIdx !== null && fi[editingImgIdx] && (
        <ImageEditorModal
          imageUrl={fi[editingImgIdx].url}
          onSave={(dataUrl) => {
            const idx = editingImgIdx;
            setEditingImgIdx(null);
            fetch(dataUrl)
              .then(r => r.blob())
              .then(blob => {
                const fd = new FormData();
                fd.append('file', blob, 'edited_' + Date.now() + '.png');
                return fetch('/api/notes/upload', { method: 'POST', body: fd });
              })
              .then(r => r.json())
              .then(j => {
                if (j.success) {
                  sFi(prev => {
                    const next = [...prev];
                    next[idx] = j.data;
                    return next;
                  });
                }
              })
              .catch(err => console.error('Save edited image failed:', err));
          }}
          onClose={() => setEditingImgIdx(null)}
        />
      )}
    </div>
    <p className="text-gray-400 mb-4">请先登录</p>
    <a href="/login" className="inline-block px-6 py-2.5 bg-gradient-to-r from-yellow-400 to-pink-400 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:scale-105 transition-all duration-300">去登录 ✨</a>
  </div>);

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-yellow-500 via-pink-500 to-purple-500 bg-clip-text text-transparent flex items-center gap-2">📝 记事本</h1>
        <button onClick={oa} className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-pink-400 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 min-h-[44px] flex items-center gap-1.5 shadow-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          新建
        </button>
        {editingImgIdx !== null && fi[editingImgIdx] && (
        <ImageEditorModal
          imageUrl={fi[editingImgIdx].url}
          onSave={(dataUrl) => {
            const idx = editingImgIdx;
            setEditingImgIdx(null);
            fetch(dataUrl)
              .then(r => r.blob())
              .then(blob => {
                const fd = new FormData();
                fd.append('file', blob, 'edited_' + Date.now() + '.png');
                return fetch('/api/notes/upload', { method: 'POST', body: fd });
              })
              .then(r => r.json())
              .then(j => {
                if (j.success) {
                  sFi(prev => {
                    const next = [...prev];
                    next[idx] = j.data;
                    return next;
                  });
                }
              })
              .catch(err => console.error('Save edited image failed:', err));
          }}
          onClose={() => setEditingImgIdx(null)}
        />
      )}
    </div>
      <form onSubmit={hs} className="mb-5">
        <div className="relative group">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-pink-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" value={si} onChange={(e)=>sSi(e.target.value)} placeholder="搜索记事..." className="w-full pl-9 pr-4 py-3 bg-white/80 backdrop-blur border-2 border-yellow-200 rounded-2xl text-sm focus:outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-100 transition-all duration-300" />
          {se&&<button type="button" onClick={()=>{sSe('');sSi('');sPg(1);sVc(new Set);}} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 hover:rotate-90 transition-all duration-300"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>}
          {editingImgIdx !== null && fi[editingImgIdx] && (
        <ImageEditorModal
          imageUrl={fi[editingImgIdx].url}
          onSave={(dataUrl) => {
            const idx = editingImgIdx;
            setEditingImgIdx(null);
            fetch(dataUrl)
              .then(r => r.blob())
              .then(blob => {
                const fd = new FormData();
                fd.append('file', blob, 'edited_' + Date.now() + '.png');
                return fetch('/api/notes/upload', { method: 'POST', body: fd });
              })
              .then(r => r.json())
              .then(j => {
                if (j.success) {
                  sFi(prev => {
                    const next = [...prev];
                    next[idx] = j.data;
                    return next;
                  });
                }
              })
              .catch(err => console.error('Save edited image failed:', err));
          }}
          onClose={() => setEditingImgIdx(null)}
        />
      )}
    </div>
      </form>
      {f?(<div className="flex justify-center py-20"><div className="flex flex-col items-center gap-3"><div className="w-10 h-10 border-[3px] border-yellow-300 border-t-pink-400 rounded-full animate-spin" /><p className="text-sm text-gray-400 animate-pulse">加载中...</p></div></div>):n.length===0?(<div className="text-center py-20 animate-fadeIn">
        <div className="inline-block p-6 bg-gradient-to-br from-yellow-50 to-pink-50 rounded-3xl shadow-sm mb-4 transform rotate-1 hover:rotate-0 transition-transform duration-500">
          <svg className="w-16 h-16 text-yellow-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          {editingImgIdx !== null && fi[editingImgIdx] && (
        <ImageEditorModal
          imageUrl={fi[editingImgIdx].url}
          onSave={(dataUrl) => {
            const idx = editingImgIdx;
            setEditingImgIdx(null);
            fetch(dataUrl)
              .then(r => r.blob())
              .then(blob => {
                const fd = new FormData();
                fd.append('file', blob, 'edited_' + Date.now() + '.png');
                return fetch('/api/notes/upload', { method: 'POST', body: fd });
              })
              .then(r => r.json())
              .then(j => {
                if (j.success) {
                  sFi(prev => {
                    const next = [...prev];
                    next[idx] = j.data;
                    return next;
                  });
                }
              })
              .catch(err => console.error('Save edited image failed:', err));
          }}
          onClose={() => setEditingImgIdx(null)}
        />
      )}
    </div>
        <p className="text-gray-400 mb-2">{se?'没有找到匹配的记事':'还没有记事'}</p>
        <p className="text-gray-300 text-sm mb-4">{se?'试试其他关键词吧':'点击右上角创建一个'}</p>
        {!se&&<button onClick={oa} className="px-5 py-2 bg-gradient-to-r from-yellow-400 to-pink-400 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:scale-105 transition-all duration-300">创建第一条记事 ✨</button>}
        {editingImgIdx !== null && fi[editingImgIdx] && (
        <ImageEditorModal
          imageUrl={fi[editingImgIdx].url}
          onSave={(dataUrl) => {
            const idx = editingImgIdx;
            setEditingImgIdx(null);
            fetch(dataUrl)
              .then(r => r.blob())
              .then(blob => {
                const fd = new FormData();
                fd.append('file', blob, 'edited_' + Date.now() + '.png');
                return fetch('/api/notes/upload', { method: 'POST', body: fd });
              })
              .then(r => r.json())
              .then(j => {
                if (j.success) {
                  sFi(prev => {
                    const next = [...prev];
                    next[idx] = j.data;
                    return next;
                  });
                }
              })
              .catch(err => console.error('Save edited image failed:', err));
          }}
          onClose={() => setEditingImgIdx(null)}
        />
      )}
    </div>):(
      <><div className="flex items-center justify-between mb-4"><p className="text-xs text-gray-400 flex items-center gap-1"><span className="inline-block w-2 h-2 bg-yellow-300 rounded-full animate-pulse" />共 {tt} 条{se&&<span className="ml-1">· 搜索: {se}</span>}</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {n.map((note,idx)=>{
          const{color,rot}=getStyle(idx);const vis=vc.has(note._id);const hi=note.images&&note.images.length>0;const ih=hi&&note.images.length>=2;
          return(
            <div key={note._id} ref={(el)=>sr(note._id,el)} data-id={note._id}
              className={[rot,'transition-all duration-700 ease-out',vis?'opacity-100 translate-y-0':'opacity-0 translate-y-8'].join(' ')}
              style={{transitionDelay:Math.min(idx*80,500)+'ms'}}>
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 w-8 h-4 bg-gray-200/60 rounded-sm opacity-60 shadow-sm" />
              <div onClick={()=>sDv(note)} className={[color.bg,'border-2',color.border,'rounded-2xl','overflow-hidden',color.shadow,'shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] group cursor-pointer'].join(' ')}>
                <div className="absolute -top-0.5 -right-0.5 w-6 h-6 bg-white/40 rounded-bl-2xl border-l-2 border-b-2 border-white/60 z-10" />
                {hi&&(<div className={['relative',ih?'h-48 sm:h-56':'h-36 sm:h-40','overflow-hidden'].join(' ')}>
                  <div className="flex h-full">
                    {note.images.slice(0,3).map((img,i)=>(<button key={i} onClick={(e)=>{e.stopPropagation();sLi({url:img.url,images:note.images,idx:i});}}
                      className={[note.images.length===1?'w-full':note.images.length===2?'w-1/2':i===0?'w-1/2':'w-1/4','overflow-hidden group/img transition-all duration-300'].join(' ')}>
                      <img src={img.thumbUrl || img.url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110" />
                      {i===2&&note.images.length>3&&<div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold text-lg">+{note.images.length-3}</div>}
                    </button>))}
                    {editingImgIdx !== null && fi[editingImgIdx] && (
        <ImageEditorModal
          imageUrl={fi[editingImgIdx].url}
          onSave={(dataUrl) => {
            const idx = editingImgIdx;
            setEditingImgIdx(null);
            fetch(dataUrl)
              .then(r => r.blob())
              .then(blob => {
                const fd = new FormData();
                fd.append('file', blob, 'edited_' + Date.now() + '.png');
                return fetch('/api/notes/upload', { method: 'POST', body: fd });
              })
              .then(r => r.json())
              .then(j => {
                if (j.success) {
                  sFi(prev => {
                    const next = [...prev];
                    next[idx] = j.data;
                    return next;
                  });
                }
              })
              .catch(err => console.error('Save edited image failed:', err));
          }}
          onClose={() => setEditingImgIdx(null)}
        />
      )}
    </div>
                  <div className={['absolute bottom-0 left-0 right-0 h-12','bg-gradient-to-t from-white/80 to-transparent'].join(' ')} />
                  {editingImgIdx !== null && fi[editingImgIdx] && (
        <ImageEditorModal
          imageUrl={fi[editingImgIdx].url}
          onSave={(dataUrl) => {
            const idx = editingImgIdx;
            setEditingImgIdx(null);
            fetch(dataUrl)
              .then(r => r.blob())
              .then(blob => {
                const fd = new FormData();
                fd.append('file', blob, 'edited_' + Date.now() + '.png');
                return fetch('/api/notes/upload', { method: 'POST', body: fd });
              })
              .then(r => r.json())
              .then(j => {
                if (j.success) {
                  sFi(prev => {
                    const next = [...prev];
                    next[idx] = j.data;
                    return next;
                  });
                }
              })
              .catch(err => console.error('Save edited image failed:', err));
          }}
          onClose={() => setEditingImgIdx(null)}
        />
      )}
    </div>)}
                <div className="p-3.5 sm:p-4">
                  {note.title&&<h3 className="font-bold text-sm sm:text-base truncate flex items-center gap-1.5"><span className={['inline-block w-2 h-2 rounded-full',color.dark.replace('text-','bg-')].join(' ')} />{note.title}</h3>}
                  {note.content&&<p className={['text-sm',note.title?'mt-1.5':'','text-gray-600','line-clamp-3','whitespace-pre-wrap','leading-relaxed'].join(' ')}>{note.content}</p>}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/50">
                    <span className="text-xs text-gray-400 flex items-center gap-1"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{new Date(note.createdAt).toLocaleDateString('zh-HK',{month:'short',day:'numeric'})}</span>
                    <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 opacity-100 transition-all duration-300 sm:translate-x-2 sm:group-hover:translate-x-0 translate-x-0">
                      <button onClick={(e)=>{e.stopPropagation();oe(note);}} className="p-1.5 rounded-lg bg-white/60 backdrop-blur text-gray-500 hover:text-pink-600 hover:bg-pink-50 transition-all duration-200 shadow-sm"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                      <button onClick={(e)=>{e.stopPropagation();sDi(note._id);}} className="p-1.5 rounded-lg bg-white/60 backdrop-blur text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all duration-200 shadow-sm"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      {editingImgIdx !== null && fi[editingImgIdx] && (
        <ImageEditorModal
          imageUrl={fi[editingImgIdx].url}
          onSave={(dataUrl) => {
            const idx = editingImgIdx;
            setEditingImgIdx(null);
            fetch(dataUrl)
              .then(r => r.blob())
              .then(blob => {
                const fd = new FormData();
                fd.append('file', blob, 'edited_' + Date.now() + '.png');
                return fetch('/api/notes/upload', { method: 'POST', body: fd });
              })
              .then(r => r.json())
              .then(j => {
                if (j.success) {
                  sFi(prev => {
                    const next = [...prev];
                    next[idx] = j.data;
                    return next;
                  });
                }
              })
              .catch(err => console.error('Save edited image failed:', err));
          }}
          onClose={() => setEditingImgIdx(null)}
        />
      )}
    </div>
                    {editingImgIdx !== null && fi[editingImgIdx] && (
        <ImageEditorModal
          imageUrl={fi[editingImgIdx].url}
          onSave={(dataUrl) => {
            const idx = editingImgIdx;
            setEditingImgIdx(null);
            fetch(dataUrl)
              .then(r => r.blob())
              .then(blob => {
                const fd = new FormData();
                fd.append('file', blob, 'edited_' + Date.now() + '.png');
                return fetch('/api/notes/upload', { method: 'POST', body: fd });
              })
              .then(r => r.json())
              .then(j => {
                if (j.success) {
                  sFi(prev => {
                    const next = [...prev];
                    next[idx] = j.data;
                    return next;
                  });
                }
              })
              .catch(err => console.error('Save edited image failed:', err));
          }}
          onClose={() => setEditingImgIdx(null)}
        />
      )}
    </div>
                  {editingImgIdx !== null && fi[editingImgIdx] && (
        <ImageEditorModal
          imageUrl={fi[editingImgIdx].url}
          onSave={(dataUrl) => {
            const idx = editingImgIdx;
            setEditingImgIdx(null);
            fetch(dataUrl)
              .then(r => r.blob())
              .then(blob => {
                const fd = new FormData();
                fd.append('file', blob, 'edited_' + Date.now() + '.png');
                return fetch('/api/notes/upload', { method: 'POST', body: fd });
              })
              .then(r => r.json())
              .then(j => {
                if (j.success) {
                  sFi(prev => {
                    const next = [...prev];
                    next[idx] = j.data;
                    return next;
                  });
                }
              })
              .catch(err => console.error('Save edited image failed:', err));
          }}
          onClose={() => setEditingImgIdx(null)}
        />
      )}
    </div>
                {editingImgIdx !== null && fi[editingImgIdx] && (
        <ImageEditorModal
          imageUrl={fi[editingImgIdx].url}
          onSave={(dataUrl) => {
            const idx = editingImgIdx;
            setEditingImgIdx(null);
            fetch(dataUrl)
              .then(r => r.blob())
              .then(blob => {
                const fd = new FormData();
                fd.append('file', blob, 'edited_' + Date.now() + '.png');
                return fetch('/api/notes/upload', { method: 'POST', body: fd });
              })
              .then(r => r.json())
              .then(j => {
                if (j.success) {
                  sFi(prev => {
                    const next = [...prev];
                    next[idx] = j.data;
                    return next;
                  });
                }
              })
              .catch(err => console.error('Save edited image failed:', err));
          }}
          onClose={() => setEditingImgIdx(null)}
        />
      )}
    </div>
              {editingImgIdx !== null && fi[editingImgIdx] && (
        <ImageEditorModal
          imageUrl={fi[editingImgIdx].url}
          onSave={(dataUrl) => {
            const idx = editingImgIdx;
            setEditingImgIdx(null);
            fetch(dataUrl)
              .then(r => r.blob())
              .then(blob => {
                const fd = new FormData();
                fd.append('file', blob, 'edited_' + Date.now() + '.png');
                return fetch('/api/notes/upload', { method: 'POST', body: fd });
              })
              .then(r => r.json())
              .then(j => {
                if (j.success) {
                  sFi(prev => {
                    const next = [...prev];
                    next[idx] = j.data;
                    return next;
                  });
                }
              })
              .catch(err => console.error('Save edited image failed:', err));
          }}
          onClose={() => setEditingImgIdx(null)}
        />
      )}
    </div>
          );})}
        {editingImgIdx !== null && fi[editingImgIdx] && (
        <ImageEditorModal
          imageUrl={fi[editingImgIdx].url}
          onSave={(dataUrl) => {
            const idx = editingImgIdx;
            setEditingImgIdx(null);
            fetch(dataUrl)
              .then(r => r.blob())
              .then(blob => {
                const fd = new FormData();
                fd.append('file', blob, 'edited_' + Date.now() + '.png');
                return fetch('/api/notes/upload', { method: 'POST', body: fd });
              })
              .then(r => r.json())
              .then(j => {
                if (j.success) {
                  sFi(prev => {
                    const next = [...prev];
                    next[idx] = j.data;
                    return next;
                  });
                }
              })
              .catch(err => console.error('Save edited image failed:', err));
          }}
          onClose={() => setEditingImgIdx(null)}
        />
      )}
    </div>
      {tp>1&&<div className="flex justify-center items-center gap-3 mt-8">
        <button onClick={()=>sPg(p=>Math.max(1,p-1))} disabled={pg===1} className="px-4 py-2 text-sm bg-white border-2 border-yellow-200 rounded-xl disabled:opacity-30 hover:border-pink-300 hover:shadow-md transition-all duration-300 flex items-center gap-1"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>上一页</button>
        <span className="text-sm font-medium text-gray-500 bg-yellow-50 px-3 py-1.5 rounded-xl border border-yellow-200">{pg}/{tp}</span>
        <button onClick={()=>sPg(p=>Math.min(tp,p+1))} disabled={pg===tp} className="px-4 py-2 text-sm bg-white border-2 border-yellow-200 rounded-xl disabled:opacity-30 hover:border-pink-300 hover:shadow-md transition-all duration-300 flex items-center gap-1">下一页<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg></button>
        {editingImgIdx !== null && fi[editingImgIdx] && (
        <ImageEditorModal
          imageUrl={fi[editingImgIdx].url}
          onSave={(dataUrl) => {
            const idx = editingImgIdx;
            setEditingImgIdx(null);
            fetch(dataUrl)
              .then(r => r.blob())
              .then(blob => {
                const fd = new FormData();
                fd.append('file', blob, 'edited_' + Date.now() + '.png');
                return fetch('/api/notes/upload', { method: 'POST', body: fd });
              })
              .then(r => r.json())
              .then(j => {
                if (j.success) {
                  sFi(prev => {
                    const next = [...prev];
                    next[idx] = j.data;
                    return next;
                  });
                }
              })
              .catch(err => console.error('Save edited image failed:', err));
          }}
          onClose={() => setEditingImgIdx(null)}
        />
      )}
    </div>}
      </>)}
      {sm&&<div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fadeIn" onClick={()=>sSm(false)}>
        <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl max-h-[85vh] overflow-y-auto shadow-2xl animate-slideUp pb-16 sm:pb-0" onClick={(e)=>e.stopPropagation()}>
          <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3.5 flex items-center justify-between z-10 rounded-t-3xl">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2"><span className="text-lg">{ei?'✏️':'📝'}</span>{ei?'编辑记事':'新建记事'}</h2>
            <button onClick={()=>sSm(false)} className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors hover:rotate-90 duration-300"><svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
            {editingImgIdx !== null && fi[editingImgIdx] && (
        <ImageEditorModal
          imageUrl={fi[editingImgIdx].url}
          onSave={(dataUrl) => {
            const idx = editingImgIdx;
            setEditingImgIdx(null);
            fetch(dataUrl)
              .then(r => r.blob())
              .then(blob => {
                const fd = new FormData();
                fd.append('file', blob, 'edited_' + Date.now() + '.png');
                return fetch('/api/notes/upload', { method: 'POST', body: fd });
              })
              .then(r => r.json())
              .then(j => {
                if (j.success) {
                  sFi(prev => {
                    const next = [...prev];
                    next[idx] = j.data;
                    return next;
                  });
                }
              })
              .catch(err => console.error('Save edited image failed:', err));
          }}
          onClose={() => setEditingImgIdx(null)}
        />
      )}
    </div>
          <form onSubmit={hsv} className="p-4 space-y-4">
            <div><label className="block text-xs font-medium text-gray-400 mb-1.5">📌 标题</label><input type="text" value={ft} onChange={(e)=>sFt(e.target.value)} placeholder="给记事起个标题（选填）" className="w-full px-3 py-2.5 border-2 border-yellow-200 rounded-xl text-sm focus:outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-50 transition-all duration-300" /></div>
            <div><label className="block text-xs font-medium text-gray-400 mb-1.5">💬 内容</label><textarea value={fc} onChange={(e)=>sFc(e.target.value)} placeholder="写点什么..." rows={4} className="w-full px-3 py-2.5 border-2 border-yellow-200 rounded-xl text-sm focus:outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-50 transition-all duration-300 resize-none" /></div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">🖼️ 图片</label>
              {fi.length>0&&<div className="flex flex-wrap gap-2 mb-2">{fi.map((img,i)=>(<div key={i} className="relative group/image"><img src={img.thumbUrl || img.url} alt="" className="w-20 h-20 rounded-xl object-cover border-2 border-yellow-100" onError={(e)=>{if(e.currentTarget.src.includes("thumb"))e.currentTarget.src=e.currentTarget.src.replace("thumb_","")}} /><button type="button" onClick={()=>setEditingImgIdx(i)} className="absolute top-1 left-1 z-10 w-5 h-5 bg-blue-500/90 text-white rounded-full flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-all duration-200 shadow-sm hover:scale-110 hover:bg-blue-600"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button><button type="button" onClick={()=>ri(i)} className="absolute -top-2 -right-2 w-5 h-5 bg-red-400 text-white rounded-full flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-all duration-200 shadow-sm hover:scale-110"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button></div>))}</div>}
              <div className="flex items-center gap-2">
                <button type="button" onClick={()=>fir.current?.click()} disabled={up} className="px-4 py-2 border-2 border-dashed border-yellow-200 rounded-xl text-sm text-gray-500 hover:border-pink-300 hover:text-pink-500 hover:bg-pink-50 transition-all duration-300 disabled:opacity-50 flex items-center gap-1.5">{up?(<><div className="w-4 h-4 border-2 border-yellow-300 border-t-pink-400 rounded-full animate-spin" />上传中...</>):(<><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>添加图片</>)}</button>
                <input ref={fir} type="file" accept="image/*" multiple onChange={hi} className="hidden" />
                {fi.length>0&&<span className="text-xs text-gray-400">{fi.length} 张</span>}
                {editingImgIdx !== null && fi[editingImgIdx] && (
        <ImageEditorModal
          imageUrl={fi[editingImgIdx].url}
          onSave={(dataUrl) => {
            const idx = editingImgIdx;
            setEditingImgIdx(null);
            fetch(dataUrl)
              .then(r => r.blob())
              .then(blob => {
                const fd = new FormData();
                fd.append('file', blob, 'edited_' + Date.now() + '.png');
                return fetch('/api/notes/upload', { method: 'POST', body: fd });
              })
              .then(r => r.json())
              .then(j => {
                if (j.success) {
                  sFi(prev => {
                    const next = [...prev];
                    next[idx] = j.data;
                    return next;
                  });
                }
              })
              .catch(err => console.error('Save edited image failed:', err));
          }}
          onClose={() => setEditingImgIdx(null)}
        />
      )}
    </div>
              {editingImgIdx !== null && fi[editingImgIdx] && (
        <ImageEditorModal
          imageUrl={fi[editingImgIdx].url}
          onSave={(dataUrl) => {
            const idx = editingImgIdx;
            setEditingImgIdx(null);
            fetch(dataUrl)
              .then(r => r.blob())
              .then(blob => {
                const fd = new FormData();
                fd.append('file', blob, 'edited_' + Date.now() + '.png');
                return fetch('/api/notes/upload', { method: 'POST', body: fd });
              })
              .then(r => r.json())
              .then(j => {
                if (j.success) {
                  sFi(prev => {
                    const next = [...prev];
                    next[idx] = j.data;
                    return next;
                  });
                }
              })
              .catch(err => console.error('Save edited image failed:', err));
          }}
          onClose={() => setEditingImgIdx(null)}
        />
      )}
    </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={sv} className="flex-1 py-2.5 bg-gradient-to-r from-yellow-400 to-pink-400 text-white font-medium rounded-xl hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all duration-300 text-sm">{sv?(<span className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />保存中...</span>):(ei?'💾 保存修改':'✨ 创建记事')}</button>
              <button type="button" onClick={()=>sSm(false)} className="px-6 py-2.5 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition-colors text-sm">取消</button>
              {editingImgIdx !== null && fi[editingImgIdx] && (
        <ImageEditorModal
          imageUrl={fi[editingImgIdx].url}
          onSave={(dataUrl) => {
            const idx = editingImgIdx;
            setEditingImgIdx(null);
            fetch(dataUrl)
              .then(r => r.blob())
              .then(blob => {
                const fd = new FormData();
                fd.append('file', blob, 'edited_' + Date.now() + '.png');
                return fetch('/api/notes/upload', { method: 'POST', body: fd });
              })
              .then(r => r.json())
              .then(j => {
                if (j.success) {
                  sFi(prev => {
                    const next = [...prev];
                    next[idx] = j.data;
                    return next;
                  });
                }
              })
              .catch(err => console.error('Save edited image failed:', err));
          }}
          onClose={() => setEditingImgIdx(null)}
        />
      )}
    </div>
          </form>
          {editingImgIdx !== null && fi[editingImgIdx] && (
        <ImageEditorModal
          imageUrl={fi[editingImgIdx].url}
          onSave={(dataUrl) => {
            const idx = editingImgIdx;
            setEditingImgIdx(null);
            fetch(dataUrl)
              .then(r => r.blob())
              .then(blob => {
                const fd = new FormData();
                fd.append('file', blob, 'edited_' + Date.now() + '.png');
                return fetch('/api/notes/upload', { method: 'POST', body: fd });
              })
              .then(r => r.json())
              .then(j => {
                if (j.success) {
                  sFi(prev => {
                    const next = [...prev];
                    next[idx] = j.data;
                    return next;
                  });
                }
              })
              .catch(err => console.error('Save edited image failed:', err));
          }}
          onClose={() => setEditingImgIdx(null)}
        />
      )}
    </div>
        {editingImgIdx !== null && fi[editingImgIdx] && (
        <ImageEditorModal
          imageUrl={fi[editingImgIdx].url}
          onSave={(dataUrl) => {
            const idx = editingImgIdx;
            setEditingImgIdx(null);
            fetch(dataUrl)
              .then(r => r.blob())
              .then(blob => {
                const fd = new FormData();
                fd.append('file', blob, 'edited_' + Date.now() + '.png');
                return fetch('/api/notes/upload', { method: 'POST', body: fd });
              })
              .then(r => r.json())
              .then(j => {
                if (j.success) {
                  sFi(prev => {
                    const next = [...prev];
                    next[idx] = j.data;
                    return next;
                  });
                }
              })
              .catch(err => console.error('Save edited image failed:', err));
          }}
          onClose={() => setEditingImgIdx(null)}
        />
      )}
    </div>}
      {di&&<div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center animate-fadeIn" onClick={()=>sDi(null)}>
        <div className="bg-white rounded-3xl p-6 mx-4 max-w-sm w-full shadow-2xl animate-scaleIn" onClick={(e)=>e.stopPropagation()}>
          <div className="text-center">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-3 transform hover:scale-110 transition-transform"><svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg></div>
            <h3 className="font-semibold text-gray-900 mb-1">确认删除</h3>
            <p className="text-sm text-gray-500 mb-5">这张便签删除后就找不回来了哦</p>
            <div className="flex gap-3">
              <button onClick={()=>sDi(null)} className="flex-1 py-2.5 border-2 border-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors text-sm">不舍得删了</button>
              <button onClick={()=>dn(di)} className="flex-1 py-2.5 bg-gradient-to-r from-red-400 to-rose-400 text-white font-medium rounded-xl hover:shadow-lg active:scale-[0.98] transition-all text-sm">确定删除</button>
              {editingImgIdx !== null && fi[editingImgIdx] && (
        <ImageEditorModal
          imageUrl={fi[editingImgIdx].url}
          onSave={(dataUrl) => {
            const idx = editingImgIdx;
            setEditingImgIdx(null);
            fetch(dataUrl)
              .then(r => r.blob())
              .then(blob => {
                const fd = new FormData();
                fd.append('file', blob, 'edited_' + Date.now() + '.png');
                return fetch('/api/notes/upload', { method: 'POST', body: fd });
              })
              .then(r => r.json())
              .then(j => {
                if (j.success) {
                  sFi(prev => {
                    const next = [...prev];
                    next[idx] = j.data;
                    return next;
                  });
                }
              })
              .catch(err => console.error('Save edited image failed:', err));
          }}
          onClose={() => setEditingImgIdx(null)}
        />
      )}
    </div>
            {editingImgIdx !== null && fi[editingImgIdx] && (
        <ImageEditorModal
          imageUrl={fi[editingImgIdx].url}
          onSave={(dataUrl) => {
            const idx = editingImgIdx;
            setEditingImgIdx(null);
            fetch(dataUrl)
              .then(r => r.blob())
              .then(blob => {
                const fd = new FormData();
                fd.append('file', blob, 'edited_' + Date.now() + '.png');
                return fetch('/api/notes/upload', { method: 'POST', body: fd });
              })
              .then(r => r.json())
              .then(j => {
                if (j.success) {
                  sFi(prev => {
                    const next = [...prev];
                    next[idx] = j.data;
                    return next;
                  });
                }
              })
              .catch(err => console.error('Save edited image failed:', err));
          }}
          onClose={() => setEditingImgIdx(null)}
        />
      )}
    </div>
          {editingImgIdx !== null && fi[editingImgIdx] && (
        <ImageEditorModal
          imageUrl={fi[editingImgIdx].url}
          onSave={(dataUrl) => {
            const idx = editingImgIdx;
            setEditingImgIdx(null);
            fetch(dataUrl)
              .then(r => r.blob())
              .then(blob => {
                const fd = new FormData();
                fd.append('file', blob, 'edited_' + Date.now() + '.png');
                return fetch('/api/notes/upload', { method: 'POST', body: fd });
              })
              .then(r => r.json())
              .then(j => {
                if (j.success) {
                  sFi(prev => {
                    const next = [...prev];
                    next[idx] = j.data;
                    return next;
                  });
                }
              })
              .catch(err => console.error('Save edited image failed:', err));
          }}
          onClose={() => setEditingImgIdx(null)}
        />
      )}
    </div>
        {editingImgIdx !== null && fi[editingImgIdx] && (
        <ImageEditorModal
          imageUrl={fi[editingImgIdx].url}
          onSave={(dataUrl) => {
            const idx = editingImgIdx;
            setEditingImgIdx(null);
            fetch(dataUrl)
              .then(r => r.blob())
              .then(blob => {
                const fd = new FormData();
                fd.append('file', blob, 'edited_' + Date.now() + '.png');
                return fetch('/api/notes/upload', { method: 'POST', body: fd });
              })
              .then(r => r.json())
              .then(j => {
                if (j.success) {
                  sFi(prev => {
                    const next = [...prev];
                    next[idx] = j.data;
                    return next;
                  });
                }
              })
              .catch(err => console.error('Save edited image failed:', err));
          }}
          onClose={() => setEditingImgIdx(null)}
        />
      )}
    </div>}
      {dv&&<div className="fixed inset-0 z-50 bg-white animate-fadeIn overflow-y-auto" onClick={()=>sDv(null)}>
        <div onClick={(e)=>e.stopPropagation()} className="min-h-screen">
          {/* Header */}
          <div className="sticky top-0 bg-white/90 backdrop-blur-md z-10 flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <button onClick={()=>sDv(null)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <span className="text-sm font-medium text-gray-500">{(dv.createdAt||'').split('T')[0]}</span>
            <div className="flex gap-1">
              <button onClick={()=>{const shareUrl=window.location.origin+"/share/"+dv._id;if(typeof navigator.share==="function"){navigator.share({title:dv.title||"",text:dv.content||"",url:shareUrl}).catch(()=>{})}else{navigator.clipboard.writeText(shareUrl).then(()=>{alert("分享链接已复制")}).catch(()=>{prompt("复制链接：",shareUrl)})}}} className="p-2 rounded-lg text-gray-500 hover:text-blue-500 hover:bg-blue-50 transition-all">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
              </button>
              <button onClick={()=>{sDv(null);oe(dv);}} className="p-2 rounded-lg text-gray-500 hover:text-pink-600 hover:bg-pink-50 transition-all">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </button>
              <button onClick={()=>{sDv(null);sDi(dv._id);}} className="p-2 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          </div>

          {/* Image carousel */}
          {dv.images && dv.images.length > 0 && (
            <div className="relative bg-black/5">
              <div className="flex overflow-x-hidden" onTouchStart={handleDetailTouchStart} onTouchEnd={handleDetailTouchEnd}>
                {dv.images.map((img, i) => (
                  <div key={i} className="w-full shrink-0 transition-transform duration-300" style={{transform:'translateX(-'+(diIdx*100)+'%)'}}>
                    <img src={img.url} alt="" className="w-full h-72 sm:h-96 object-contain" onClick={(e)=>{e.stopPropagation();sLi({url:img.url,images:dv.images,idx:i});}} />
                  </div>
                ))}
              </div>
              {/* Dots */}
              {dv.images.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {dv.images.map((_, i) => (
                    <button key={i} onClick={(e)=>{e.stopPropagation();sDiIdx(i);}} className={'w-2 h-2 rounded-full transition-all duration-300 '+(i===diIdx?'bg-gray-800 w-4':'bg-gray-300')} />
                  ))}
                </div>
              )}
              {/* Left/Right arrows */}
              {diIdx > 0 && (
                <button onClick={(e)=>{e.stopPropagation();sDiIdx(i=>i-1);}} className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all">
                  <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
              )}
              {dv.images && diIdx < dv.images.length - 1 && (
                <button onClick={(e)=>{e.stopPropagation();sDiIdx(i=>i+1);}} className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all">
                  <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className="px-5 py-4">
            {dv.title && <h1 className="text-lg font-bold text-gray-900 mb-2">{dv.title}</h1>}
            {dv.content && <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{dv.content}</p>}
            {!dv.title && !dv.content && <p className="text-sm text-gray-400 italic">暂无文字内容</p>}
          </div>

          {/* Bottom padding */}
          <div className="h-8" />
        </div>
      </div>}
{li&&<div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center touch-none select-none animate-fadeIn" onClick={cl}>
        <button onClick={cl} className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/15 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-white/30 hover:rotate-90 transition-all duration-300"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
        {li.images.length > 1 && (
          <div className="absolute top-4 left-4 z-10 px-3 py-1.5 bg-white/15 backdrop-blur rounded-full text-white text-xs font-medium">
            {li.idx + 1} / {li.images.length}
          </div>
        )}
        {li.idx > 0 && (
          <button onClick={(e) => { e.stopPropagation(); goImg(-1); }} className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/15 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-white/30 hover:scale-110 transition-all duration-200">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
        )}
        {li.idx < li.images.length - 1 && (
          <button onClick={(e) => { e.stopPropagation(); goImg(1); }} className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/15 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-white/30 hover:scale-110 transition-all duration-200">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        )}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/15 backdrop-blur rounded-full px-4 py-2 shadow-lg">
          <button onClick={(e)=>{e.stopPropagation();sZm(z=>Math.max(0.5,z-0.5));}} className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg></button>
          <span className="text-white text-sm font-medium min-w-[3rem] text-center tabular-nums">{Math.round(zm*100)}%</span>
          <button onClick={(e)=>{e.stopPropagation();sZm(z=>Math.min(5,z+0.5));}} className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg></button>
          <button onClick={(e)=>{e.stopPropagation();sZm(1);sPn({x:0,y:0});}} className="ml-2 px-3 py-1 text-xs text-white/70 hover:text-white bg-white/20 rounded-full hover:bg-white/40 transition-colors">重置</button>
        </div>
        <img src={li.url} alt="" className="max-w-[92vw] max-h-[90vh] object-contain cursor-grab active:cursor-grabbing transition-transform duration-150 rounded-2xl shadow-2xl"
          style={{transform:'scale('+zm+') translate('+(pn.x/zm)+'px,'+(pn.y/zm)+'px)'}}
          onClick={(e)=>e.stopPropagation()} draggable={false}
          onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} />
      </div>}
      {editingImgIdx !== null && fi[editingImgIdx] && (
        <ImageEditorModal
          imageUrl={fi[editingImgIdx].url}
          onSave={(dataUrl) => {
            const idx = editingImgIdx;
            setEditingImgIdx(null);
            fetch(dataUrl)
              .then(r => r.blob())
              .then(blob => {
                const fd = new FormData();
                fd.append('file', blob, 'edited_' + Date.now() + '.png');
                return fetch('/api/notes/upload', { method: 'POST', body: fd });
              })
              .then(r => r.json())
              .then(j => {
                if (j.success) {
                  sFi(prev => {
                    const next = [...prev];
                    next[idx] = j.data;
                    return next;
                  });
                }
              })
              .catch(err => console.error('Save edited image failed:', err));
          }}
          onClose={() => setEditingImgIdx(null)}
        />
      )}
    </div>
  );
}