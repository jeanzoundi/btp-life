import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AcademieGenerateurService } from './academie-generateur.service';
import { PrismaService } from '../prisma/prisma.service';
import type { PublierModuleDto } from './dto/academie-generateur.dto';

async function service() {
  const prisma = {
    moduleAcademie: {
      aggregate: jest.fn().mockResolvedValue({ _max: { ordre: 3 } }),
      upsert: jest.fn().mockImplementation(({ create }) => Promise.resolve({ id: 'module-1', ...create })),
    },
    cours: {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: `cours-${Math.random()}`, ...data })),
    },
    mission: {
      create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: `mission-${Math.random()}`, ...data })),
    },
    missionContenu: {
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
  };
  const module = await Test.createTestingModule({
    providers: [AcademieGenerateurService, { provide: PrismaService, useValue: prisma }],
  }).compile();
  return { svc: module.get(AcademieGenerateurService), prisma };
}

describe('AcademieGenerateurService.analyser — découpage en chapitres', () => {
  it('découpe sur des titres markdown quand au moins deux sont détectés', async () => {
    const { svc } = await service();
    const texte = [
      '# Le béton armé',
      '',
      'Le béton armé combine béton et acier pour résister à la traction.',
      '',
      '# Le ferraillage',
      '',
      'Le ferraillage désigne la mise en place des armatures avant coulage.',
    ].join('\n');

    const preview = svc.analyser(texte, 'cours-beton.txt');
    expect(preview.chapitres).toHaveLength(2);
    expect(preview.chapitres[0].titre).toBe('Le béton armé');
    expect(preview.chapitres[1].titre).toBe('Le ferraillage');
  });

  it('se rabat sur un regroupement par volume quand aucun titre clair n’est détecté', async () => {
    const { svc } = await service();
    const paragraphe = 'Ceci est une phrase de test répétée plusieurs fois pour simuler un vrai paragraphe de contenu technique. '.repeat(20);
    const texte = Array.from({ length: 4 }, () => paragraphe).join('\n\n');

    const preview = svc.analyser(texte, 'notes-sans-titres.txt');
    expect(preview.chapitres.length).toBeGreaterThanOrEqual(1);
    expect(preview.chapitres[0].titre).toBe('Chapitre 1');
  });

  it('rejette un document vide ou inexploitable', async () => {
    const { svc } = await service();
    expect(() => svc.analyser('   \n\n  ', 'vide.txt')).toThrow(BadRequestException);
  });
});

describe('AcademieGenerateurService.analyser — typage des blocs', () => {
  it('reconnaît les préfixes Exemple/Astuce/Attention/Retenir et retire le préfixe', async () => {
    const { svc } = await service();
    const texte = [
      '# Chapitre unique',
      '',
      'Un paragraphe de texte normal qui explique une notion technique en détail.',
      '',
      'Exemple : voici un cas concret rencontré sur un vrai chantier de construction.',
      '',
      'Astuce : pense toujours à vérifier deux fois avant de couler le béton frais.',
      '',
      'Attention : une erreur fréquente est de confondre les deux notions proches.',
      '',
      'À retenir : les points essentiels du chapitre tiennent en une phrase brève.',
      '',
      '# Deuxième chapitre',
      '',
      'Un autre paragraphe pour forcer la détection de deux chapitres distincts ici.',
    ].join('\n');

    const preview = svc.analyser(texte, 'test.txt');
    const types = preview.chapitres[0].blocs.map((b) => b.type);
    expect(types).toEqual(expect.arrayContaining(['texte', 'exemple', 'astuce', 'attention', 'retenir']));
    const blocExemple = preview.chapitres[0].blocs.find((b) => b.type === 'exemple');
    expect(blocExemple?.valeur.toLowerCase()).not.toMatch(/^exemple/);
  });
});

describe('AcademieGenerateurService.analyser — génération d’exercice', () => {
  it('génère un QCM à partir de phrases définitionnelles détectées', async () => {
    const { svc } = await service();
    const texte = [
      '# Vocabulaire',
      '',
      'Le maître d\'ouvrage est la personne qui commande et finance les travaux.',
      '',
      'Le maître d\'œuvre désigne celui qui conçoit et dirige le projet technique.',
      '',
      '# Suite',
      '',
      'Un chef de chantier correspond à la personne qui encadre les ouvriers au quotidien.',
    ].join('\n');

    const preview = svc.analyser(texte, 'vocabulaire.txt');
    const chapitreAvecExercice = preview.chapitres.find((c) => c.exercice);
    expect(chapitreAvecExercice).toBeDefined();
    expect(chapitreAvecExercice!.exercice!.questions.length).toBeGreaterThan(0);
    for (const q of chapitreAvecExercice!.exercice!.questions) {
      expect(q.options.map((o) => o.id)).toContain(q.bonneReponse);
      expect(q.options.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('signale par un avertissement les chapitres sans définition détectée', async () => {
    const { svc } = await service();
    const texte = [
      '# Chapitre vague',
      '',
      'Un paragraphe qui ne contient aucune phrase définitionnelle reconnaissable ici.',
      '',
      '# Autre chapitre vague',
      '',
      'Encore un paragraphe sans structure de définition particulière à signaler.',
    ].join('\n');

    const preview = svc.analyser(texte, 'vague.txt');
    expect(preview.chapitres.every((c) => c.exercice === null)).toBe(true);
    expect(preview.avertissements.length).toBe(preview.chapitres.length);
  });
});

describe('AcademieGenerateurService.publier', () => {
  const dtoBase: PublierModuleDto = {
    titre: 'Ma Matière Test',
    domaine: 'general',
    publie: false,
    chapitres: [
      {
        titre: 'Chapitre 1',
        dureeMin: 5,
        blocs: [{ type: 'texte', valeur: 'Contenu du premier chapitre.' }],
        exercice: {
          titre: 'Quiz — Chapitre 1',
          questions: [
            {
              enonce: 'Question test ?',
              options: [{ id: 'a', label: 'Bonne réponse' }, { id: 'b', label: 'Mauvaise réponse' }],
              bonneReponse: 'a',
              correctionPedagogique: 'Explication.',
            },
          ],
        },
      },
      {
        titre: 'Chapitre 2 sans exercice',
        dureeMin: 4,
        blocs: [{ type: 'texte', valeur: 'Contenu du second chapitre.' }],
      },
    ],
  };

  it('crée le module, ses cours, et une mission QCM uniquement pour les chapitres avec exercice', async () => {
    const { svc, prisma } = await service();
    const resultat = await svc.publier('user-1', dtoBase);

    expect(prisma.moduleAcademie.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.cours.deleteMany).toHaveBeenCalledWith({ where: { moduleId: 'module-1' } });
    expect(prisma.mission.create).toHaveBeenCalledTimes(1); // un seul chapitre a un exercice
    expect(prisma.missionContenu.createMany).toHaveBeenCalledTimes(1);
    expect(prisma.cours.create).toHaveBeenCalledTimes(2);
    expect(resultat.chapitres).toHaveLength(2);
  });

  it('attribue la mission créée à son créateur (createdById)', async () => {
    const { svc, prisma } = await service();
    await svc.publier('user-42', dtoBase);
    const appelMission = prisma.mission.create.mock.calls[0][0];
    expect(appelMission.data.createdById).toBe('user-42');
  });
});
