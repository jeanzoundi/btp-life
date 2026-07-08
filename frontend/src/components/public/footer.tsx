import Link from 'next/link';

export function PublicFooter() {
  return (
    <footer className="border-t border-pierre bg-graphite text-ivoire">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <p className="font-display text-lg font-bold">
              BTP <span className="text-terracotta">Life</span>
            </p>
            <p className="mt-2 text-sm text-ivoire/70">
              Choisis ton métier. Apprends. Travaille. Évolue. Construis ta carrière dans le BTP.
            </p>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-ivoire/50">Produit</p>
            <ul className="space-y-1 text-sm text-ivoire/80">
              <li><Link href="/metiers">Découvrir les métiers</Link></li>
              <li><Link href="/simulator">BTP Simulator</Link></li>
              <li><Link href="/academie">Académie</Link></li>
              <li><Link href="/tarifs">Tarifs</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-ivoire/50">B2B</p>
            <ul className="space-y-1 text-sm text-ivoire/80">
              <li><Link href="/ecoles">Écoles</Link></li>
              <li><Link href="/entreprises">Entreprises</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-ivoire/50">Légal</p>
            <ul className="space-y-1 text-sm text-ivoire/80">
              <li><Link href="/legal/cgu">CGU</Link></li>
              <li><Link href="/legal/confidentialite">Confidentialité</Link></li>
              <li><Link href="/legal/mentions-legales">Mentions légales</Link></li>
              <li><Link href="/legal/cookies">Cookies</Link></li>
              <li><Link href="/legal/avertissement">Avertissement pédagogique</Link></li>
            </ul>
          </div>
        </div>
        <p className="mt-8 border-t border-ivoire/10 pt-6 text-xs text-ivoire/50">
          BTP Life est un simulateur pédagogique. Les contenus techniques et normatifs servent à l&apos;apprentissage
          et ne remplacent pas les normes officielles, les bureaux d&apos;études, les ingénieurs habilités, les
          laboratoires agréés ni les obligations réglementaires du pays concerné.
        </p>
      </div>
    </footer>
  );
}
