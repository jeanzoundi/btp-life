'use client';

import { useEffect, useRef, useState } from 'react';
import { zoneMusicaleProche } from '@/lib/zones-musicales';

type ContexteAudio = AudioContext;
function frequence(note: number) { return 440 * 2 ** ((note - 69) / 12); }

export function ControleZoneMusicale({ position, interieur }: { position: [number, number]; interieur: boolean }) {
  const zone = interieur ? null : zoneMusicaleProche(position);
  const [active, setActive] = useState<string | null>(null);
  const [volume, setVolume] = useState(.16);
  const audio = useRef<{ contexte: ContexteAudio; gain: GainNode; timer: number } | null>(null);
  const arreter = () => {
    if (!audio.current) return;
    window.clearInterval(audio.current.timer);
    audio.current.gain.gain.setTargetAtTime(0, audio.current.contexte.currentTime, .04);
    void audio.current.contexte.close(); audio.current = null; setActive(null);
  };
  useEffect(() => () => { if (audio.current) { window.clearInterval(audio.current.timer); void audio.current.contexte.close(); } }, []);
  useEffect(() => { if (active && (!zone || zone.id !== active)) arreter(); }, [zone?.id, active]);
  useEffect(() => { if (audio.current) audio.current.gain.gain.setTargetAtTime(volume, audio.current.contexte.currentTime, .04); }, [volume]);
  const demarrer = () => {
    if (!zone || active) return;
    const AudioCtor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;
    const contexte = new AudioCtor(), gain = contexte.createGain(); gain.gain.value = volume; gain.connect(contexte.destination);
    let pas = 0;
    const jouer = () => {
      const maintenant = contexte.currentTime;
      const osc = contexte.createOscillator(), enveloppe = contexte.createGain();
      osc.type = pas % 4 === 0 ? 'triangle' : 'sine'; osc.frequency.value = frequence(zone.notes[pas % zone.notes.length]);
      enveloppe.gain.setValueAtTime(0, maintenant); enveloppe.gain.linearRampToValueAtTime(.5, maintenant + .025); enveloppe.gain.exponentialRampToValueAtTime(.001, maintenant + .32);
      osc.connect(enveloppe); enveloppe.connect(gain); osc.start(maintenant); osc.stop(maintenant + .34); pas++;
    };
    jouer(); const timer = window.setInterval(jouer, 60_000 / zone.tempo);
    audio.current = { contexte, gain, timer }; setActive(zone.id);
  };
  if (!zone) return null;
  return <details aria-label={`Zone musicale : ${zone.nom}`} className="hud-carte absolute bottom-[150px] right-3 z-[8] max-w-52 px-3 py-2">
    <summary className="cursor-pointer py-0.5 text-xs font-extrabold focus-visible:outline focus-visible:outline-2 focus-visible:outline-mangue">♫ Musique{active ? ' · En écoute' : ''}</summary>
    <div className="mt-2 border-t-2 border-encre/15 pt-2">
    <p className="text-[10px] font-extrabold uppercase tracking-widest text-mangue">♫ Zone musicale</p><strong className="mt-1 block text-sm">{zone.nom}</strong><span className="text-[10px] text-encre/60">{zone.style}</span>
    <button onClick={active ? arreter : demarrer} className="hud-bouton mt-2 w-full bg-foret px-3 py-2 text-xs text-creme">{active ? '■ Arrêter' : '▶ Écouter'}</button>
    {active && <label className="mt-2 block text-[10px] font-bold text-encre/70">Volume<input aria-label="Volume de la zone musicale" className="mt-1 w-full accent-[#006B3F]" type="range" min="0" max="0.3" step="0.02" value={volume} onChange={e => setVolume(Number(e.target.value))} /></label>}
    </div>
  </details>;
}
