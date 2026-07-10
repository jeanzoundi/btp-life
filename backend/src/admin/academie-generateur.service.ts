import { BadRequestException, Injectable } from '@nestjs/common';
import * as mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import { PrismaService } from '../prisma/prisma.service';
import { PublierModuleDto } from './dto/academie-generateur.dto';

// ─────────────────────────────────────────────────────────────────────────
// Générateur de cours à partir d'un document uploadé — 100 % programmatique
// (règles de découpage + regex), aucune API IA externe, aucune clé requise.
// La qualité du découpage dépend donc de la mise en forme du document ; c'est
// pourquoi tout passe par un aperçu modifiable avant publication (voir
// AcademieGenerateurController) plutôt qu'une écriture directe en base.
// ─────────────────────────────────────────────────────────────────────────

export type TypeBloc = 'texte' | 'exemple' | 'astuce' | 'attention' | 'retenir' | 'objectifs';
export interface BlocGenere {
  type: TypeBloc;
  valeur: string;
}
export interface QuestionGeneree {
  enonce: string;
  options: { id: string; label: string }[];
  bonneReponse: string;
  correctionPedagogique: string;
}
export interface ChapitreGenere {
  titre: string;
  dureeMin: number;
  blocs: BlocGenere[];
  exercice: { titre: string; questions: QuestionGeneree[] } | null;
}
export interface PreviewModule {
  titre: string;
  domaine: string;
  chapitres: ChapitreGenere[];
  avertissements: string[];
}

const PREFIXES_BLOC: Array<{ regex: RegExp; type: TypeBloc }> = [
  { regex: /^exemple\s*:?\s*/i, type: 'exemple' },
  { regex: /^(astuce|conseil)\s*:?\s*/i, type: 'astuce' },
  { regex: /^(attention|important|erreur (fréquente|courante)|piège)\s*:?\s*/i, type: 'attention' },
  { regex: /^(à retenir|a retenir|retenir|résumé|en résumé)\s*:?\s*/i, type: 'retenir' },
  { regex: /^objectifs?\s*:?\s*/i, type: 'objectifs' },
];

const REGEX_TITRE_MARKDOWN = /^#{1,3}\s+(.+)$/;
const REGEX_TITRE_MOT_CLE = /^(chapitre|partie|section)\s+([0-9]+|[ivxlc]+)\s*[:\-–.]?\s*(.*)$/i;
const REGEX_TITRE_NUMERO = /^(\d{1,2}|[IVXLC]{1,5})[.)]\s+(.{3,90})$/;
const REGEX_DEFINITION = /^([A-ZÀ-Ý][\wÀ-ÿ' -]{2,50}?)\s+(est|désigne|correspond à|signifie|permet de|consiste à)\s+(.{15,220}?)[.!]\s*$/;

function slugify(s: string): string {
  return (
    s
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'module'
  );
}

function nettoyerLignes(texte: string): string[] {
  return texte
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim());
}

/** Détecte un titre de chapitre plausible sur UNE ligne — markdown, mot-clé ou numéro. */
function ligneEstTitre(ligne: string): string | null {
  if (!ligne) return null;
  const md = ligne.match(REGEX_TITRE_MARKDOWN);
  if (md) return md[1].trim();
  const motCle = ligne.match(REGEX_TITRE_MOT_CLE);
  if (motCle) return (motCle[3] || `${motCle[1]} ${motCle[2]}`).trim();
  const numero = ligne.match(REGEX_TITRE_NUMERO);
  if (numero && !ligne.endsWith('.') && ligne.length < 90) return numero[2].trim();
  return null;
}

function typerParagraphe(p: string): BlocGenere {
  for (const { regex, type } of PREFIXES_BLOC) {
    if (regex.test(p)) return { type, valeur: p.replace(regex, '').trim() };
  }
  return { type: 'texte', valeur: p.trim() };
}

/** Coupe un texte de chapitre en paragraphes typés, en fusionnant les fragments trop courts. */
function decouperEnBlocs(texte: string): BlocGenere[] {
  const paragraphes = texte
    .split(/\n\s*\n+/)
    .map((p) => p.replace(/\n/g, ' ').trim())
    .filter(Boolean);

  const fusionnes: string[] = [];
  for (const p of paragraphes) {
    if (fusionnes.length && p.length < 20) {
      fusionnes[fusionnes.length - 1] += ' ' + p;
    } else {
      fusionnes.push(p);
    }
  }

  const blocs = fusionnes.map(typerParagraphe).filter((b) => b.valeur.length > 0);

  // Slide deck trop long : on regroupe les blocs "texte" excédentaires par paires.
  const MAX_BLOCS = 14;
  if (blocs.length <= MAX_BLOCS) return blocs;
  const regroupes: BlocGenere[] = [];
  for (let i = 0; i < blocs.length; i++) {
    const precedent = regroupes[regroupes.length - 1];
    if (regroupes.length >= MAX_BLOCS && precedent && precedent.type === 'texte' && blocs[i].type === 'texte') {
      precedent.valeur += '\n\n' + blocs[i].valeur;
    } else {
      regroupes.push({ ...blocs[i] });
    }
  }
  return regroupes;
}

interface DefinitionExtraite {
  terme: string;
  reponse: string;
}

function extraireDefinitions(texte: string): DefinitionExtraite[] {
  const phrases = texte
    .split(/\n+/)
    .flatMap((ligne) => ligne.split(/(?<=[.!?])\s+/))
    .map((s) => s.trim())
    .filter(Boolean);

  const definitions: DefinitionExtraite[] = [];
  for (const phrase of phrases) {
    const m = phrase.match(REGEX_DEFINITION);
    if (m) {
      const terme = m[1].trim();
      const reponse = `${m[2]} ${m[3]}`.trim().replace(/\s+/g, ' ');
      if (reponse.length > 12 && reponse.length < 200) definitions.push({ terme, reponse });
    }
  }
  return definitions;
}

function genererExercice(titreChapitre: string, definitionsChapitre: DefinitionExtraite[], toutesLesDefinitions: DefinitionExtraite[]): { titre: string; questions: QuestionGeneree[] } | null {
  if (!definitionsChapitre.length) return null;

  const autresReponses = toutesLesDefinitions.filter((d) => !definitionsChapitre.includes(d)).map((d) => d.reponse);

  const questions: QuestionGeneree[] = definitionsChapitre.slice(0, 4).map((def) => {
    const distracteursDisponibles = autresReponses.filter((r) => r !== def.reponse);
    const distracteurs = melanger(distracteursDisponibles).slice(0, 2);
    // Complète avec des leurres génériques si le document n'a pas assez d'autres définitions.
    while (distracteurs.length < 2) {
      distracteurs.push(`Une notion différente, sans lien direct avec « ${def.terme} »`);
    }
    const idsLettres = ['a', 'b', 'c'];
    const propositions = melanger([def.reponse, ...distracteurs]);
    const options = propositions.map((label, i) => ({ id: idsLettres[i], label: capitaliser(label) }));
    const bonneReponse = options.find((o) => o.label === capitaliser(def.reponse))?.id ?? 'a';

    return {
      enonce: `Que signifie « ${def.terme} » ?`,
      options,
      bonneReponse,
      correctionPedagogique: `${def.terme} ${def.reponse}.`,
    };
  });

  return { titre: `Quiz — ${titreChapitre}`, questions };
}

function melanger<T>(arr: T[]): T[] {
  const copie = [...arr];
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copie[i], copie[j]] = [copie[j], copie[i]];
  }
  return copie;
}

function capitaliser(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

@Injectable()
export class AcademieGenerateurService {
  constructor(private readonly prisma: PrismaService) {}

  async extraireTexte(buffer: Buffer, mimetype: string, nomFichier: string): Promise<string> {
    const ext = nomFichier.split('.').pop()?.toLowerCase();
    if (mimetype === 'application/pdf' || ext === 'pdf') {
      const parser = new PDFParse({ data: buffer });
      try {
        const resultat = await parser.getText();
        return resultat.text;
      } finally {
        await parser.destroy();
      }
    }
    if (mimetype.includes('wordprocessingml') || ext === 'docx') {
      const resultat = await mammoth.extractRawText({ buffer });
      return resultat.value;
    }
    if (ext === 'txt' || ext === 'md' || mimetype.startsWith('text/')) {
      return buffer.toString('utf-8');
    }
    throw new BadRequestException('Format non supporté — utilise un PDF, un .docx ou un fichier texte (.txt/.md)');
  }

  /** Découpe le texte brut en chapitres — titres détectés, sinon regroupement par volume. */
  private decouperEnChapitres(texte: string): { titre: string; texte: string }[] {
    // On garde les lignes vides (elles portent les frontières de paragraphe utilisées par
    // decouperEnBlocs) — seule la détection de titre ignore les lignes vides, pas l'extraction.
    const lignes = nettoyerLignes(texte);
    const indicesTitres: { index: number; titre: string }[] = [];
    for (let i = 0; i < lignes.length; i++) {
      if (!lignes[i]) continue;
      const titre = ligneEstTitre(lignes[i]);
      if (titre) indicesTitres.push({ index: i, titre });
    }

    if (indicesTitres.length >= 2) {
      const chapitres: { titre: string; texte: string }[] = [];
      for (let i = 0; i < indicesTitres.length; i++) {
        const debut = indicesTitres[i].index + 1;
        const fin = i + 1 < indicesTitres.length ? indicesTitres[i + 1].index : lignes.length;
        chapitres.push({ titre: indicesTitres[i].titre, texte: lignes.slice(debut, fin).join('\n') });
      }
      return chapitres.filter((c) => c.texte.trim().length > 40);
    }

    // Pas de titres détectés : on regroupe par paragraphes, ~450 mots par chapitre.
    const paragraphes = texte.split(/\n\s*\n+/).map((p) => p.trim()).filter(Boolean);
    const CIBLE_MOTS = 450;
    const groupes: string[][] = [];
    let groupeCourant: string[] = [];
    let motsCourant = 0;
    for (const p of paragraphes) {
      groupeCourant.push(p);
      motsCourant += p.split(/\s+/).length;
      if (motsCourant >= CIBLE_MOTS) {
        groupes.push(groupeCourant);
        groupeCourant = [];
        motsCourant = 0;
      }
    }
    if (groupeCourant.length) groupes.push(groupeCourant);

    return groupes.map((g, i) => ({ titre: `Chapitre ${i + 1}`, texte: g.join('\n\n') }));
  }

  /** Orchestre le découpage complet et renvoie un aperçu modifiable, sans rien écrire en base. */
  analyser(texte: string, nomFichier: string): PreviewModule {
    const brut = this.decouperEnChapitres(texte);
    if (!brut.length) {
      throw new BadRequestException('Aucun contenu exploitable dans ce document — vérifie que le texte est bien extractible (pas un scan image).');
    }

    // Définitions repérées sur tout le document, pour piocher des leurres plausibles entre chapitres.
    const definitionsParChapitre = brut.map((c) => extraireDefinitions(c.texte));
    const toutesLesDefinitions = definitionsParChapitre.flat();

    const avertissements: string[] = [];
    const chapitres: ChapitreGenere[] = brut.map((c, i) => {
      const blocs = decouperEnBlocs(c.texte);
      const nbMots = c.texte.split(/\s+/).filter(Boolean).length;
      const dureeMin = Math.max(3, Math.round(nbMots / 130));
      const exercice = genererExercice(c.titre, definitionsParChapitre[i], toutesLesDefinitions);
      if (!exercice) avertissements.push(`« ${c.titre} » : aucun exercice généré automatiquement — ajoute-en un manuellement avant de publier.`);
      return { titre: c.titre, dureeMin, blocs, exercice };
    });

    const titreModule = nomFichier
      .replace(/\.[^.]+$/, '')
      .replace(/[_-]+/g, ' ')
      .trim()
      .replace(/\b\w/g, (l) => l.toUpperCase());

    return { titre: titreModule || 'Nouvelle matière', domaine: 'general', chapitres, avertissements };
  }

  /** Persiste l'aperçu (éventuellement modifié par l'admin) — ModuleAcademie + Cours + Mission/QCM par chapitre. */
  async publier(userId: string, dto: PublierModuleDto) {
    const moduleSlug = slugify(dto.titre);
    const dernierOrdre = await this.prisma.moduleAcademie.aggregate({ _max: { ordre: true } });
    const ordre = (dernierOrdre._max.ordre ?? 0) + 1;

    const module = await this.prisma.moduleAcademie.upsert({
      where: { slug: moduleSlug },
      create: { slug: moduleSlug, titre: dto.titre, domaine: dto.domaine, ordre, publie: dto.publie ?? false },
      update: { titre: dto.titre, domaine: dto.domaine, publie: dto.publie ?? false },
    });

    // Republier une matière du même nom remplace ses chapitres — cohérent avec le seed applicatif.
    await this.prisma.cours.deleteMany({ where: { moduleId: module.id } });

    const coursCreés: { titre: string; id: string }[] = [];
    for (let i = 0; i < dto.chapitres.length; i++) {
      const chapitre = dto.chapitres[i];
      let missionId: string | undefined;

      if (chapitre.exercice) {
        const missionSlug = `${moduleSlug}-${i + 1}-exo-${Date.now().toString(36)}`;
        const mission = await this.prisma.mission.create({
          data: {
            slug: missionSlug,
            titre: chapitre.exercice.titre,
            type: 'QUIZ',
            niveauRequis: 1,
            conditionReussite: 60,
            statut: 'PUBLIE',
            createdById: userId,
          },
        });
        await this.prisma.missionContenu.createMany({
          data: chapitre.exercice.questions.map((q, ordreQ) => ({
            missionId: mission.id,
            ordre: ordreQ + 1,
            typeQuestion: 'QCM' as const,
            enonce: q.enonce,
            options: q.options as never,
            bonnesReponses: [q.bonneReponse] as never,
            correctionPedagogique: q.correctionPedagogique,
          })),
        });
        missionId = mission.id;
      }

      const cours = await this.prisma.cours.create({
        data: {
          moduleId: module.id,
          titre: chapitre.titre,
          contenu: { blocs: chapitre.blocs } as never,
          dureeMin: chapitre.dureeMin,
          missionPratiqueId: missionId,
        },
      });
      coursCreés.push({ titre: cours.titre, id: cours.id });
    }

    return { module, chapitres: coursCreés };
  }
}
