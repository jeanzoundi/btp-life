import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CertificatsService, estMerite, lireCondition, numeroCertificat, type EtatJoueur } from './certificats.service';
import { certificatsDuJeu, OFFRES_EMPLOI, PROFILS_EXPERTS, REGLES_EXPERTS } from '../../prisma/seed-data/carriere-data';
import { NIVEAU_DEPART_MAX } from '../carriere/carriere.service';

const etat = (surcharge: Partial<EtatJoueur> = {}): EtatJoueur => ({
  coursLus: new Set(),
  coursParModule: new Map([['lecture-de-plans', ['c1', 'c2']], ['vide', []]]),
  profilActuel: null,
  profilsOccupes: new Set(),
  profils: new Map([['conducteur-travaux', { id: 'p-ct', famille: 'CHANTIER', ordre: 5 }], ['bim-manager', { id: 'p-bm', famille: 'BIM', ordre: 5 }]]),
  ...surcharge,
});

describe('les conditions des certificats', () => {
  it('une attestation demande tous les cours du module, et un module sans cours ne donne rien', () => {
    const module = { type: 'module', module: 'lecture-de-plans' } as const;
    expect(estMerite(module, etat({ coursLus: new Set(['c1']) }))).toBe(false);
    expect(estMerite(module, etat({ coursLus: new Set(['c1', 'c2']) }))).toBe(true);
    expect(estMerite({ type: 'module', module: 'vide' }, etat())).toBe(false);
  });
  it('un certificat de métier se gagne au poste, plus haut dans la même filière, ou s’il a été occupé un jour', () => {
    const metier = { type: 'metier', profil: 'conducteur-travaux' } as const;
    expect(estMerite(metier, etat({ profilActuel: { id: 'p-cc', famille: 'CHANTIER', ordre: 4 } }))).toBe(false);
    expect(estMerite(metier, etat({ profilActuel: { id: 'p-ct', famille: 'CHANTIER', ordre: 5 } }))).toBe(true);
    expect(estMerite(metier, etat({ profilActuel: { id: 'p-dt', famille: 'CHANTIER', ordre: 6 } }))).toBe(true);
    // Passé entrepreneur après avoir été conducteur de travaux : le parcours reste terminé.
    expect(estMerite(metier, etat({ profilActuel: { id: 'p-ent', famille: 'ENTREPRENEUR', ordre: 1 }, profilsOccupes: new Set(['p-ct']) }))).toBe(true);
    expect(estMerite({ type: 'metier', profil: 'bim-manager' }, etat({ profilActuel: { id: 'p-dt', famille: 'CHANTIER', ordre: 6 } }))).toBe(false);
  });
  it('ignore les conditions inconnues et numérote les certificats', () => {
    expect(lireCondition({ type: 'examen', mission: 'x' })).toBeNull();
    expect(lireCondition(null)).toBeNull();
    expect(lireCondition({ type: 'metier', profil: 'gerant' })).toEqual({ type: 'metier', profil: 'gerant' });
    expect(numeroCertificat(new Date('2026-10-26T12:00:00Z'), Buffer.from([0xab, 0x01, 0xff, 0x10]))).toBe('BTPL-2026-AB01FF10');
  });
});

describe('le contenu de carrière', () => {
  it('donne deux échelons au-delà du niveau 20 à chaque filière, chacun avec sa promotion et hors de portée à la création', () => {
    const familles = new Set(PROFILS_EXPERTS.map((p) => p.famille));
    expect(familles.size).toBe(8);
    for (const p of PROFILS_EXPERTS) {
      expect(p.niveauDepart).toBeGreaterThan(20);
      expect(p.niveauDepart).toBeGreaterThan(NIVEAU_DEPART_MAX);
      expect(REGLES_EXPERTS.filter((r) => r.cible === p.slug)).toHaveLength(1);
    }
  });
  it('propose une trentaine d’offres avec les cinq premières, chacune vers un poste qui existe', () => {
    expect(OFFRES_EMPLOI.length + 5).toBeGreaterThanOrEqual(30);
    expect(new Set(OFFRES_EMPLOI.map((o) => o.titre)).size).toBe(OFFRES_EMPLOI.length);
    const experts = new Set(PROFILS_EXPERTS.map((p) => p.slug));
    // Une offre vers un échelon expert demande au moins le niveau de la promotion vers ce poste.
    for (const o of OFFRES_EMPLOI.filter((o) => experts.has(o.profil))) {
      const regle = REGLES_EXPERTS.find((r) => r.cible === o.profil)!;
      expect(o.niveauMin).toBeGreaterThanOrEqual(regle.conditions.niveauMin);
    }
  });
  it('fait un certificat par module, par métier visé et par échelon expert', () => {
    const certificats = certificatsDuJeu([{ slug: 'lecture-de-plans', titre: 'Lecture de plans' }], [{ slug: 'gerant', nom: 'Entrepreneur' }]);
    expect(certificats).toHaveLength(2 + PROFILS_EXPERTS.length);
    expect(certificats[0]).toEqual({ slug: 'attestation-lecture-de-plans', nom: 'Attestation de formation — Lecture de plans', conditions: { type: 'module', module: 'lecture-de-plans' } });
    expect(certificats[1].nom).toBe('Certificat de fin de parcours — Entrepreneur');
  });
});

function fakePrisma(overrides: { recus?: Array<{ certificatId: string }>; coursLus?: string[]; createRejette?: unknown } = {}) {
  const crees: Array<{ userId: string; certificatId: string; numeroUnique: string }> = [];
  const prisma = {
    certificat: {
      findMany: jest.fn().mockResolvedValue([
        { id: 'cert-plans', slug: 'attestation-lecture-de-plans', nom: 'Attestation de formation — Lecture de plans', conditions: { type: 'module', module: 'lecture-de-plans' } },
        { id: 'cert-ct', slug: 'parcours-conducteur-travaux', nom: 'Certificat de fin de parcours — Conducteur de travaux', conditions: { type: 'metier', profil: 'conducteur-travaux' } },
        { id: 'cert-admin', slug: 'manuel', nom: 'Créé dans l’admin', conditions: { note: 'remis en main propre' } },
      ]),
    },
    userCertificat: {
      findMany: jest.fn().mockResolvedValue(overrides.recus ?? []),
      findFirst: jest.fn().mockResolvedValue({ id: 'deja' }),
      create: jest.fn().mockImplementation(({ data }) => {
        if (overrides.createRejette) return Promise.reject(overrides.createRejette);
        crees.push(data);
        return Promise.resolve(data);
      }),
    },
    userCours: { findMany: jest.fn().mockResolvedValue((overrides.coursLus ?? ['c1', 'c2']).map((coursId) => ({ coursId }))) },
    moduleAcademie: { findMany: jest.fn().mockResolvedValue([{ slug: 'lecture-de-plans', cours: [{ id: 'c1' }, { id: 'c2' }] }]) },
    userCarriere: { findUnique: jest.fn().mockResolvedValue({ profilActuel: { id: 'p-cc', famille: 'CHANTIER', ordre: 4 } }) },
    carriereHistorique: { findMany: jest.fn().mockResolvedValue([]) },
    profil: { findMany: jest.fn().mockResolvedValue([{ id: 'p-ct', slug: 'conducteur-travaux', famille: 'CHANTIER', ordre: 5 }]) },
  };
  return { prisma, crees };
}
async function service(prisma: ReturnType<typeof fakePrisma>['prisma']) {
  const notifications = { envoyerNotification: jest.fn().mockResolvedValue(undefined) };
  const module = await Test.createTestingModule({
    providers: [CertificatsService, { provide: PrismaService, useValue: prisma }, { provide: NotificationsService, useValue: notifications }],
  }).compile();
  return { svc: module.get(CertificatsService), notifications };
}

describe('CertificatsService.delivrer', () => {
  it('délivre l’attestation du module fini, une seule fois, avec un message', async () => {
    const { prisma, crees } = fakePrisma();
    const { svc, notifications } = await service(prisma);
    const delivres = await svc.delivrer('u1');
    expect(delivres.map((d) => d.slug)).toEqual(['attestation-lecture-de-plans']);
    expect(crees).toEqual([expect.objectContaining({ userId: 'u1', certificatId: 'cert-plans', numeroUnique: expect.stringMatching(/^BTPL-\d{4}-[0-9A-F]{8}$/) })]);
    expect(notifications.envoyerNotification).toHaveBeenCalledWith('u1', expect.objectContaining({ titre: 'Certificat délivré : Attestation de formation — Lecture de plans', lien: '/app/recompenses' }));
  });
  it('ne refait rien quand tout ce qui est mérité est déjà reçu', async () => {
    const { prisma } = fakePrisma({ recus: [{ certificatId: 'cert-plans' }] });
    const { svc, notifications } = await service(prisma);
    await expect(svc.delivrer('u1')).resolves.toEqual([]);
    expect(prisma.userCertificat.create).not.toHaveBeenCalled();
    expect(notifications.envoyerNotification).not.toHaveBeenCalled();
  });
  it('n’échoue pas quand une autre requête vient de délivrer le même certificat', async () => {
    const doublon = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: '5' });
    const { prisma } = fakePrisma({ createRejette: doublon });
    const { svc, notifications } = await service(prisma);
    await expect(svc.delivrer('u1')).resolves.toEqual([]);
    expect(notifications.envoyerNotification).not.toHaveBeenCalled();
  });
});
