'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { longueurChemin, pointSurChemin, type EtapePnj } from '@/lib/journee-pnj';
import { itineraireVille } from '@/lib/itineraire-ville';
import { orienterProgressivement } from '@/lib/fluidite-monde';
import { ECHELLE_PERSONNAGES } from '@/lib/echelle-monde';
import type { IdentitePersonnage } from '@/lib/identites-personnages';
import type { GestePersonnage } from '@/lib/personnages-realistes';
import { penseePnj, type ContextePensee } from '@/lib/pensees-monde';
import { HumainMonde } from './humain-monde';
import { BullePensee, usePenseePeriodique } from './humeur-monde';

type PointMonde = [number, number];
type Emprise = { x: number; z: number; largeur: number; profondeur: number };
type Allure = { marche: boolean; assis: boolean; geste?: GestePersonnage; allure: number };

/** Le salut se donne une fois quand le joueur s'approche, pas à chaque pas : au plus une fois toutes les 45 secondes. */
const DISTANCE_SALUT = 6, DUREE_SALUT = 1.9, RELANCE_SALUT = 45;

/** Un habitant à la journée continue (lib/journee-pnj.ts) : il suit son trajet à l'heure près, fait ses allées et venues
 * au travail, s'assoit à la terrasse du maquis pour déjeuner et le soir. Quand le joueur arrive, il le salue de la main ;
 * en conversation, il se tourne vers lui et parle avec les mains. Un clic : on va lui parler. */
export function HabitantJournee({ nom, identite, couleur, variante, etape, heure, rythme, pause, enConversation, joueur, destination, onParler, contexte, bulles, suivi, emprises }: {
  nom: string; identite: IdentitePersonnage; couleur: string; variante: number; etape: EtapePnj; heure: number; rythme: number; pause: boolean; enConversation: boolean;
  joueur: React.MutableRefObject<THREE.Vector3>; destination: React.MutableRefObject<PointMonde | null>; onParler: (nom: string) => void;
  contexte: ContextePensee; bulles: boolean; suivi?: React.MutableRefObject<Map<string, THREE.Vector3>>; emprises: readonly Emprise[];
}) {
  const ref = useRef<THREE.Group>(null);
  useEffect(() => { const carte = suivi?.current; if (!carte || !ref.current) return; carte.set(nom, ref.current.position); return () => { carte.delete(nom); }; }, [nom, suivi]);
  // L'heure avance entre deux pas de l'horloge (cinq minutes de jeu) : on l'estime d'après le temps réel écoulé.
  const horloge = useRef({ heure, depuis: 0 });
  useEffect(() => { horloge.current = { heure, depuis: 0 }; }, [heure]);
  const chemin = useMemo<PointMonde[] | null>(() => {
    if (etape.phase !== 'trajet' || !etape.depart || !etape.arrivee) return null;
    const itineraire = itineraireVille(etape.depart, etape.arrivee, [...emprises]);
    return [etape.depart, ...(itineraire.length ? itineraire : [etape.arrivee])];
  // Un trajet se calcule une fois, à son début.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etape.de, etape.phase, nom]);
  const longueur = useMemo(() => chemin ? longueurChemin(chemin) : 0, [chemin]);
  const index = useRef(0), approche = useRef(false), salut = useRef(0), dernierSalut = useRef(-Infinity), temps = useRef(0);
  const [allure, setAllure] = useState<Allure>({ marche: false, assis: false, allure: 1.4 });
  const actuelle = useRef(allure);
  const cible = useMemo(() => new THREE.Vector3(), []), ecart = useMemo(() => new THREE.Vector3(), []);
  const pensee = usePenseePeriodique(graine => penseePnj(nom, contexte, graine + variante), bulles && !pause && !enConversation, 7 + variante * 2.3, 22,
    () => Boolean(ref.current && ref.current.position.distanceTo(joueur.current) < 34));
  // À l'apparition, il se tient au début de son étape (chez lui, à son poste, ou sur sa chaise).
  useEffect(() => {
    if (!ref.current) return;
    const p = etape.phase === 'trajet' ? pointSurChemin(chemin ?? [], etape.avancee).point : etape.siege?.position ?? etape.allees?.[0];
    if (p) ref.current.position.set(p[0], 0, p[1]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useFrame((_, delta) => {
    const g = ref.current;
    if (!g) return;
    const dt = Math.min(delta, .05);
    temps.current += dt;
    if (!pause) horloge.current.depuis += dt;
    const heureCourante = horloge.current.heure + horloge.current.depuis * rythme / 60;
    const versJoueur = Math.atan2(joueur.current.x - g.position.x, joueur.current.z - g.position.z);
    const distanceJoueur = g.position.distanceTo(joueur.current);
    let suivante: Allure = { marche: false, assis: false, allure: 1.4 };
    if (approche.current && distanceJoueur <= 4) { approche.current = false; destination.current = null; onParler(nom); }
    // Le joueur arrive près de lui : il s'arrête et le salue (sauf assis à table, où il se contente de tourner la tête).
    if (!enConversation && !pause && distanceJoueur < DISTANCE_SALUT && temps.current - dernierSalut.current > RELANCE_SALUT && !etape.siege) {
      dernierSalut.current = temps.current; salut.current = DUREE_SALUT;
    }
    if (enConversation || pause) {
      // Assis à table, il reste assis pour parler ; debout, il se tourne vers le joueur.
      const siege = etape.siege, assis = Boolean(siege) && g.position.distanceTo(cible.set(siege?.position[0] ?? 0, 0, siege?.position[1] ?? 0)) < .4;
      if (!assis) g.rotation.y = orienterProgressivement(g.rotation.y, versJoueur, delta);
      suivante = { marche: false, assis, geste: enConversation ? 'parle' : undefined, allure: 1.4 };
    } else if (salut.current > 0) {
      salut.current -= dt;
      g.rotation.y = orienterProgressivement(g.rotation.y, versJoueur, delta);
      suivante = { marche: false, assis: false, geste: 'salue', allure: 1.4 };
    } else if (chemin) {
      const avancee = Math.min(1, Math.max(0, (heureCourante - etape.de) / (etape.a - etape.de)));
      const { point, cap } = pointSurChemin(chemin, avancee);
      cible.set(point[0], 0, point[1]);
      // Un saut de l'horloge (attente, sommeil) le pose directement là où il doit être.
      if (g.position.distanceTo(cible) > 15) g.position.copy(cible);
      else g.position.lerp(cible, 1 - Math.exp(-8 * dt));
      g.rotation.y = orienterProgressivement(g.rotation.y, cap, delta);
      const secondes = (etape.a - etape.de) * 60 / Math.max(rythme, .2);
      suivante = { marche: avancee < 1, assis: false, allure: longueur / secondes };
    } else if (etape.siege) {
      cible.set(etape.siege.position[0], 0, etape.siege.position[1]);
      ecart.subVectors(cible, g.position);
      if (ecart.length() > .35) {
        g.position.addScaledVector(ecart.normalize(), Math.min(ecart.length(), 1.6 * dt * Math.max(rythme, 1)));
        g.rotation.y = orienterProgressivement(g.rotation.y, Math.atan2(ecart.x, ecart.z), delta);
        suivante = { marche: true, assis: false, allure: 1.6 };
      } else {
        g.position.copy(cible);
        g.rotation.y = orienterProgressivement(g.rotation.y, etape.siege.orientation, delta);
        suivante = { marche: false, assis: true, allure: 1.4 };
      }
    } else if (etape.allees?.length) {
      const allees = etape.allees, point = allees[index.current % allees.length];
      cible.set(point[0], 0, point[1]);
      ecart.subVectors(cible, g.position);
      if (ecart.length() < .35) {
        index.current = (index.current + 1) % allees.length;
        // Seul à son poste : il regarde la rue et parle de temps en temps avec les ouvriers.
        if (allees.length === 1) suivante = { marche: false, assis: false, geste: Math.sin(temps.current * .35) > .55 ? 'parle' : undefined, allure: 1.4 };
      } else {
        g.position.addScaledVector(ecart.normalize(), Math.min(ecart.length(), 1.3 * dt * Math.max(rythme, 1)));
        g.rotation.y = orienterProgressivement(g.rotation.y, Math.atan2(ecart.x, ecart.z), delta);
        suivante = { marche: true, assis: false, allure: 1.3 };
      }
    }
    const a = actuelle.current;
    if (a.marche !== suivante.marche || a.assis !== suivante.assis || a.geste !== suivante.geste || Math.abs(a.allure - suivante.allure) > .4) {
      actuelle.current = suivante; setAllure(suivante);
    }
  });
  return <group ref={ref} onClick={e => {
    e.stopPropagation(); if (e.delta >= 5 || !ref.current) return;
    if (ref.current.position.distanceTo(joueur.current) <= 4) onParler(nom);
    else { approche.current = true; destination.current = [ref.current.position.x, ref.current.position.z]; }
  }}>
    <HumainMonde nom={`${nom} · Parler`} couleur={couleur} identite={identite} variante={variante} marche={allure.marche} assis={allure.assis} geste={allure.geste} allure={allure.allure} scale={ECHELLE_PERSONNAGES} />
    <BullePensee pensee={pensee} hauteur={allure.assis ? 2.3 : 2.9} />
  </group>;
}
