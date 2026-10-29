// La mise en forme légère des pages légales écrites dans l'administration (Pages CMS, champ « texte ») : une ligne
// « ## Titre » devient un intertitre, les lignes « - … » une liste, une ligne vide sépare deux paragraphes. Un texte
// sans ces marques reste un simple paragraphe, comme avant.

export type BlocLegal =
  | { type: 'titre'; texte: string }
  | { type: 'paragraphe'; texte: string }
  | { type: 'liste'; elements: string[] };

export function blocsLegaux(texte: string): BlocLegal[] {
  const blocs: BlocLegal[] = [];
  for (const morceau of texte.replace(/\r\n/g, '\n').split(/\n\s*\n/)) {
    const lignes = morceau.split('\n').map((l) => l.trim()).filter(Boolean);
    let paragraphe: string[] = [];
    const finirParagraphe = () => { if (paragraphe.length) blocs.push({ type: 'paragraphe', texte: paragraphe.join(' ') }); paragraphe = []; };
    for (const ligne of lignes) {
      if (ligne.startsWith('## ')) { finirParagraphe(); blocs.push({ type: 'titre', texte: ligne.slice(3).trim() }); continue; }
      if (ligne.startsWith('- ')) {
        finirParagraphe();
        const precedent = blocs.at(-1);
        if (precedent?.type === 'liste') precedent.elements.push(ligne.slice(2).trim());
        else blocs.push({ type: 'liste', elements: [ligne.slice(2).trim()] });
        continue;
      }
      paragraphe.push(ligne);
    }
    finirParagraphe();
  }
  return blocs;
}
