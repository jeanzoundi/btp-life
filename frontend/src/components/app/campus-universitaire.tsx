'use client';
import { Canvas } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import { SALLES_CAMPUS, type NiveauCampus } from '@/lib/campus-universitaire';
import { CampusScene, type PositionCampus, type VueCampus } from './campus-scene';
import { AtelierCampus } from './atelier-campus';

export function CampusUniversitaire({onSortir,children}:{onSortir:()=>void;children?:ReactNode}){
  const directions=useMemo(()=>new Set<string>(),[]);
  const [vue,setVue]=useState<VueCampus>('joueur'),[angle,setAngle]=useState(0),[niveauPlan,setNiveauPlan]=useState<NiveauCampus>(0);
  const [plan,setPlan]=useState(false),[services,setServices]=useState(false),[interagir,setInteragir]=useState(false);
  const [position,setPosition]=useState<PositionCampus>({x:0,z:10,y:0,etage:0});
  const [proximite,setProximite]=useState<string|null>(null),[destination,setDestination]=useState<{id:string;serie:number}|null>(null);
  const [message,setMessage]=useState('Bienvenue. Marchez vers les portes ou utilisez le plan du campus.');
  const [reussites,setReussites]=useState<string[]>([]);
  const lieu=SALLES_CAMPUS.find(s=>s.id===proximite);
  const selectionner=useCallback((id:string)=>{directions.clear();setDestination(v=>({id,serie:(v?.serie??0)+1}));setPlan(false);setVue('joueur');setInteragir(false);},[directions]);
  const changerProximite=useCallback((id:string|null)=>{setProximite(id);setInteragir(false);},[]);
  useEffect(()=>{
    const touches:Record<string,string>={KeyW:'avant',KeyZ:'avant',ArrowUp:'avant',KeyS:'arriere',ArrowDown:'arriere',KeyA:'gauche',KeyQ:'gauche',ArrowLeft:'gauche',KeyD:'droite',ArrowRight:'droite',ShiftLeft:'courir',ShiftRight:'courir'};
    const down=(e:KeyboardEvent)=>{if((e.target as HTMLElement)?.matches('input,textarea,select,[contenteditable]'))return;if(e.code==='Escape'){if(interagir)setInteragir(false);else if(plan)setPlan(false);else onSortir();return;}if(e.code==='KeyM'){setPlan(v=>!v);return;}if(e.code==='KeyE'&&lieu){setInteragir(v=>!v);return;}if(touches[e.code]&&!interagir&&!services&&vue==='joueur'){e.preventDefault();directions.add(touches[e.code]);}};
    const up=(e:KeyboardEvent)=>directions.delete(touches[e.code]);const clear=()=>directions.clear();
    window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',clear);document.addEventListener('visibilitychange',clear);
    return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',clear);document.removeEventListener('visibilitychange',clear);directions.clear();};
  },[directions,interagir,plan,onSortir,lieu,vue,services]);
  const bouton='rounded-xl border border-white/20 bg-slate-950/90 px-3 py-2 text-xs font-semibold text-white shadow-lg hover:bg-slate-700';
  return <section className="fixed inset-0 z-[100] bg-[#b6c6c7]" aria-label="Campus universitaire navigable">
    <Canvas shadows dpr={[1,1.5]} camera={{position:[0,4,16],fov:58,near:.1,far:180}} gl={{antialias:true,toneMapping:THREE.ACESFilmicToneMapping,toneMappingExposure:1}}>
      <CampusScene directions={directions} destination={destination} vue={vue} angle={angle} niveauPlan={niveauPlan} onPosition={setPosition} onProximite={changerProximite} onMessage={setMessage} selectionner={selectionner}/>
    </Canvas>
    <header className="pointer-events-none absolute inset-x-0 top-0 flex justify-between gap-3 bg-gradient-to-b from-slate-950/90 to-transparent p-4 pb-12 text-white">
      <div><p className="text-[10px] uppercase tracking-[.25em] text-amber-200">Campus des bâtisseurs</p><h2 className="mt-1 text-lg font-bold sm:text-2xl">Université BTP</h2><p className="mt-1 text-xs text-white/80">{position.etage===0?'Rez-de-chaussée':'Étage 1'} · {lieu?.label??'Circulation du campus'}</p></div>
      <button className={`${bouton} pointer-events-auto self-start`} onClick={onSortir}>Sortir</button>
    </header>
    <nav aria-label="Commandes du campus" className="absolute left-3 right-3 top-28 flex flex-wrap gap-2">
      <button className={bouton} aria-expanded={plan} onClick={()=>{setPlan(v=>!v);directions.clear();}}>Plan · 16 lieux</button>
      <button className={bouton} onClick={()=>{directions.clear();setVue(v=>v==='joueur'?'plan':'joueur');}}>{vue==='joueur'?'Vue d’ensemble':'Suivre le joueur'}</button>
      {vue==='plan'?<button className={bouton} onClick={()=>setNiveauPlan(v=>v===0?1:0)}>{niveauPlan===0?'Afficher l’étage':'Afficher le RDC'}</button>:<><button aria-label="Tourner la caméra à gauche" className={bouton} onClick={()=>setAngle(a=>a-Math.PI/4)}>↶ Caméra</button><button aria-label="Tourner la caméra à droite" className={bouton} onClick={()=>setAngle(a=>a+Math.PI/4)}>Caméra ↷</button></>}
      <button className={bouton} aria-expanded={services} onClick={()=>{directions.clear();setServices(v=>!v);}}>Services du compte</button>
    </nav>
    {plan&&<aside className="absolute bottom-36 left-3 right-3 top-52 overflow-y-auto rounded-2xl border border-white/20 bg-slate-950/95 p-4 text-white shadow-xl sm:right-auto sm:top-44 sm:w-80">
      <div className="flex items-center justify-between"><h3 className="font-bold">Choisir une destination</h3><button aria-label="Fermer le plan" onClick={()=>setPlan(false)}>✕</button></div>
      <p className="my-2 text-xs text-white/60">Le joueur suit les couloirs et passe par l’escalier.</p>
      {([0,1] as const).map(n=><div key={n}><h4 className="my-3 text-xs font-bold uppercase text-amber-200">{n===0?'RDC · Vie du campus':'Étage · Études & recherche'}</h4><div className="grid grid-cols-2 gap-2">{SALLES_CAMPUS.filter(s=>s.etage===n).map(s=><button key={s.id} className="rounded-lg border-l-2 bg-white/5 p-2 text-left text-xs hover:bg-white/15" style={{borderColor:s.couleur}} onClick={()=>selectionner(s.id)}>{s.label}</button>)}</div></div>)}
    </aside>}
    <div className="absolute bottom-4 right-4 hidden rounded-xl border border-white/20 bg-slate-950/90 p-2 text-white sm:block" aria-label="Mini-plan du campus">
      <svg viewBox="-26 -21 52 57" className="h-36 w-36" role="img" aria-label={`Position du joueur au niveau ${position.etage}`}>
        <rect x="-24" y="-19" width="48" height="53" fill="#344b50"/>
        {SALLES_CAMPUS.filter(s=>s.etage===position.etage).map(s=><rect key={s.id} x={s.cx-s.largeur/2} y={s.cz-s.profondeur/2} width={s.largeur} height={s.profondeur} fill={s.couleur} opacity=".7"/>)}
        <rect x="-1.4" y="-5" width="2.8" height="10" fill="#ede2c4"/>
        <circle cx={position.x} cy={position.z} r="1" fill="#ffdc65" stroke="white" strokeWidth=".4"/>
      </svg><p className="text-center text-[10px]">{Math.round(position.x)} / {Math.round(position.z)} · N{position.etage}</p>
    </div>
    {!interagir&&!services&&!plan&&<>
      <div className="absolute bottom-4 left-4 grid grid-cols-3 gap-1" aria-label="Déplacements tactiles">
        <span/>{[['avant','▲'],['gauche','◀'],['arriere','▼'],['droite','▶']].map(([d,t],i)=><button key={d} aria-label={`Marcher ${d}`} className={`${bouton} h-11 w-11 touch-none ${i===1?'col-start-1':''}`} onPointerDown={e=>{if(vue!=='joueur')return;e.currentTarget.setPointerCapture(e.pointerId);directions.add(d);}} onPointerUp={()=>directions.delete(d)} onPointerCancel={()=>directions.delete(d)}>{t}</button>)}
      </div>
      <div className="pointer-events-none absolute bottom-32 left-4 right-4 mx-auto max-w-lg rounded-xl bg-slate-950/90 p-3 text-center text-xs text-white sm:bottom-5 sm:left-44 sm:right-44">
        {lieu?<button className="pointer-events-auto w-full rounded-lg bg-amber-200 p-3 font-bold text-slate-900" onClick={()=>{directions.clear();setInteragir(true);}}>E · Rencontrer {lieu.responsable}</button>:<p role="status">{message}</p>}
        <p className="mt-2 text-[10px] text-white/60">ZQSD / flèches · Maj : courir · M : plan · E : interagir</p>
      </div>
    </>}
    {interagir&&lieu&&<aside aria-label={`Interaction ${lieu.label}`} className="absolute bottom-4 left-3 right-3 top-52 overflow-y-auto rounded-2xl border border-white/20 bg-slate-950/95 p-5 text-white shadow-xl sm:left-auto sm:top-44 sm:w-96">
      <button className={`${bouton} float-right`} onClick={()=>setInteragir(false)}>Fermer</button><p className="text-xs text-amber-200">{lieu.label}</p><h3 className="mt-2 pr-16 text-lg font-semibold">{lieu.responsable}</h3>
      <AtelierCampus key={lieu.id} station={lieu.id} dejaReussi={reussites.includes(lieu.id)} onReussite={()=>setReussites(v=>v.includes(lieu.id)?v:[...v,lieu.id])}/>
      <p className="mt-3 text-xs text-white/60">{reussites.length} exercice(s) réussi(s) pendant cette visite.</p>
    </aside>}
    {services&&<div className="absolute inset-x-4 bottom-4 top-52 overflow-auto rounded-2xl bg-slate-950/95 p-5 text-white sm:top-44"><button className={bouton} onClick={()=>setServices(false)}>Revenir au campus</button><div className="relative mt-4 min-h-64">{children}</div></div>}
  </section>;
}
