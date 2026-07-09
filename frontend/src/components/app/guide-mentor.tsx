'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { MentorBulle } from './mentor';
import { jouerSon } from '@/lib/sons';

// Un petit mot d'Akissi la toute première fois que le joueur ouvre chaque onglet.
// Persisté en localStorage : ne s'affiche plus jamais une fois lu.
const GUIDES: Record<string, { titre: string; texte: string }> = {
  '/app': {
    titre: 'Ton tableau de bord',
    texte:
      "Bienvenue ! Ici tu vois toujours où tu en es : ta mission recommandée du jour, ton chantier en cours et tes messages. C'est ton point de départ à chaque connexion.",
  },
  '/app/missions': {
    titre: 'Les missions',
    texte:
      "Chaque mission te fait progresser : quiz, calculs, décisions à conséquences... Réussis-en une pour gagner de l'XP, de la réputation et parfois un badge. Un échec n'est jamais grave, la correction t'explique tout.",
  },
  '/app/chantiers': {
    titre: 'BTP Simulator',
    texte:
      "Ici tu gères un vrai chantier : budget, stock de matériaux, équipe d'ouvriers, avancement des travaux. Démarrer un chantier demande un apport personnel (ton propre argent, en plus du niveau requis) — plus le projet est ambitieux, plus l'apport est élevé, alors passe à la Banque si besoin. Des projets plus ambitieux s'ouvrent avec ta progression — aménagement urbain dès le niveau 4, villa R+1 et voirie au niveau 5, le pont au niveau 8, puis assainissement (10), groupe scolaire (12), centre de santé (15), lotissement (18) et le complexe industriel portuaire au niveau 20, le chantier le plus exigeant du jeu (certains sont accessibles plus tôt à un poste avancé de la filière). Je serai là pour te conseiller à chaque étape.",
  },
  '/app/academie': {
    titre: "L'Académie BTP",
    texte:
      'Des cours en diapositives, courts et illustrés, pour apprendre les bases du métier. Chaque cours se termine par une mission pratique pour valider ce que tu as appris.',
  },
  '/app/logiciels': {
    titre: 'Académie Logiciels',
    texte:
      "Word, Excel, AutoCAD, Revit... apprends à t'en servir sur de vrais cas de chantier, sans avoir besoin de les installer. Chaque leçon est une mini-formation en diapositives.",
  },
  '/app/competences': {
    titre: 'Tes compétences',
    texte:
      "Chaque compétence monte en niveau (1 à 5) quand tu réussis les missions et cours qui s'y rapportent. C'est ce qui débloque les meilleures offres et les promotions.",
  },
  '/app/parcours': {
    titre: 'Ton parcours de carrière',
    texte:
      "Voici le chemin que tu as choisi pour ta carrière, étape par étape. Ta position actuelle est mise en avant — chaque promotion te fait avancer sur cette ligne.",
  },
  '/app/cv': {
    titre: 'Ton CV virtuel',
    texte:
      "Il se remplit tout seul avec chacune de tes réussites : compétences, chantiers livrés, badges, certificats. Tu n'as jamais rien à rédiger — et tu peux l'exporter à tout moment.",
  },
  '/app/offres': {
    titre: "Offres d'emploi",
    texte:
      "Candidate aux postes qui t'intéressent : ton CV est envoyé automatiquement. Si on te refuse, tu reçois toujours un plan d'action précis pour retenter ta chance.",
  },
  '/app/promotions': {
    titre: 'Les promotions',
    texte:
      "Ta progression n'est jamais automatique : chaque promotion a ses conditions (compétences, chantiers, réputation...). Je t'indique toujours ce qu'il te manque.",
  },
  '/app/recompenses': {
    titre: 'Badges & certificats',
    texte:
      'Ta vitrine ! Les badges arrivent automatiquement en jouant, les certificats demandent un peu plus de rigueur. Tout est vérifiable et s\'affiche sur ton CV.',
  },
  '/app/classements': {
    titre: 'Le classement',
    texte:
      "Compare ta progression (XP) à celle des autres joueurs. Rejoue tes missions pour grimper — la compétition est amicale, mais bien réelle !",
  },
  '/app/monde': {
    titre: 'Le monde virtuel',
    texte:
      "Une vraie ville t'attend : le centre-ville, un campus avec plusieurs écoles (tu es inscrit(e) dans l'une d'elles, repère le halo doré ⭐), et un quartier résidentiel où tu as ta propre maison 🏠 dès ta connexion. D'autres zones sont encore verrouillées — elles se débloquent en montant de niveau. Et tu n'es pas seul(e) : les avatars que tu croises sont de vrais autres joueurs actifs, tout comme leurs maisons — touche-les pour voir leur profil et les saluer !",
  },
  '/app/fournisseur': {
    titre: 'Le fournisseur',
    texte:
      "Voici le catalogue de prix du pays : matériaux, main-d'œuvre, tout y est. Utilise ces prix pour chiffrer juste tes devis et savoir combien commander sur tes chantiers.",
  },
  '/app/depot': {
    titre: 'Ton dépôt',
    texte:
      "Ici tu retrouves tout ce que tu as déjà fait livrer sur tes chantiers en cours : le stock centralisé, chantier par chantier, plus l'historique de tes dernières commandes.",
  },
  '/app/lieu/maquis': {
    titre: 'Le Maquis',
    texte: "Un bon plat et ta faim repart au max ! Ça coûte un peu d'argent réel (120 F), mais un ventre vide, c'est moins d'XP sur tes missions — l'investissement en vaut la peine.",
  },
  '/app/lieu/cafe': {
    titre: 'Le Café',
    texte: "Viens discuter pour refaire le plein de social, pour 90 F. Un personnage bien entouré travaille mieux — et c'est ici que se tisse ton réseau de bâtisseurs.",
  },
  '/app/lieu/residence': {
    titre: 'Ta Résidence',
    texte: "Rentre dormir quand ton énergie faiblit — gratuit, c'est chez toi. Une bonne nuit et tu récupères tout — indispensable pour enchaîner les journées de chantier à plein régime.",
  },
  '/app/lieu/banque': {
    titre: 'La Banque',
    texte: "Ton argent virtuel est ici : gagné sur les missions et chantiers, dépensé au Maquis, au Café et en apport personnel pour démarrer un chantier. Dépose-le en épargne pour le faire fructifier avec un petit intérêt chaque jour — retire-le quand tu as besoin de liquide.",
  },
  '/app/messages': {
    titre: 'Ta messagerie',
    texte: "Les personnages du jeu (mentor, recruteurs, clients) t'écrivent ici au fil de ta progression. Pense à vérifier régulièrement.",
  },
  '/app/parametres': {
    titre: 'Paramètres',
    texte: 'Modifie tes informations de compte ici. Pour personnaliser ton avatar et voir tes statistiques, direction ton profil !',
  },
  '/app/profil': {
    titre: 'Ton profil',
    texte:
      "Personnalise complètement ton avatar (visage, tenue, outils, cadre...), consulte ton radar de compétences et suis tes statistiques de carrière.",
  },
};

export function GuideMentor() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const guide = GUIDES[pathname];

  useEffect(() => {
    if (!guide) {
      setVisible(false);
      return;
    }
    const cle = `btplife_guide_vu:${pathname}`;
    setVisible(window.localStorage.getItem(cle) !== '1');
  }, [pathname, guide]);

  if (!guide || !visible) return null;

  function fermer() {
    window.localStorage.setItem(`btplife_guide_vu:${pathname}`, '1');
    jouerSon('clic');
    setVisible(false);
  }

  return (
    <div className="anim-fade-up mb-4 sm:mb-6">
      <MentorBulle nom="Akissi" role={guide.titre}>
        <p>{guide.texte}</p>
        <button
          onClick={fermer}
          className="mt-2.5 rounded-full bg-terracotta px-4 py-1.5 text-xs font-semibold text-ivoire transition-transform hover:scale-105"
        >
          J&apos;ai compris ✔
        </button>
      </MentorBulle>
    </div>
  );
}
