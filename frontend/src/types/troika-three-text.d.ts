// troika-three-text (dépendance de drei) ne publie pas de types pour son point d'entrée : seule la configuration utilisée est déclarée.
declare module 'troika-three-text' {
  export function configureTextBuilder(config: { defaultFontURL?: string | null; [option: string]: unknown }): void;
}
