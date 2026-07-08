// Petits sons de jeu synthétisés (WebAudio) — aucun fichier audio requis.
// Volume discret, échec silencieux si l'API n'est pas disponible.

type TypeSon = 'succes' | 'echec' | 'clic' | 'badge' | 'niveau';

let contexte: AudioContext | null = null;

function ctx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!contexte) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      contexte = new AC();
    }
    if (contexte.state === 'suspended') void contexte.resume();
    return contexte;
  } catch {
    return null;
  }
}

function note(ac: AudioContext, freq: number, debut: number, duree: number, volume = 0.08, type: OscillatorType = 'triangle') {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, ac.currentTime + debut);
  gain.gain.linearRampToValueAtTime(volume, ac.currentTime + debut + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + debut + duree);
  osc.connect(gain).connect(ac.destination);
  osc.start(ac.currentTime + debut);
  osc.stop(ac.currentTime + debut + duree + 0.05);
}

export function jouerSon(type: TypeSon) {
  const ac = ctx();
  if (!ac) return;
  try {
    switch (type) {
      case 'succes': // arpège majeur ascendant
        note(ac, 523.25, 0, 0.18); // do
        note(ac, 659.25, 0.09, 0.18); // mi
        note(ac, 783.99, 0.18, 0.3); // sol
        break;
      case 'echec': // deux notes descendantes, douces
        note(ac, 392, 0, 0.2, 0.06, 'sine');
        note(ac, 311.13, 0.16, 0.35, 0.06, 'sine');
        break;
      case 'clic':
        note(ac, 880, 0, 0.06, 0.04, 'square');
        break;
      case 'badge': // scintillement
        note(ac, 1046.5, 0, 0.12, 0.05);
        note(ac, 1318.5, 0.08, 0.12, 0.05);
        note(ac, 1568, 0.16, 0.25, 0.05);
        note(ac, 2093, 0.24, 0.3, 0.04);
        break;
      case 'niveau': // fanfare courte
        note(ac, 523.25, 0, 0.15);
        note(ac, 523.25, 0.15, 0.1);
        note(ac, 659.25, 0.25, 0.15);
        note(ac, 783.99, 0.4, 0.4, 0.1);
        break;
    }
  } catch {
    // silencieux
  }
}
