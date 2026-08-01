'use client';

import { useEffect } from 'react';
import { journaliserErreur } from '@/lib/journal-erreurs';

// Filet de sécurité ultime : se déclenche si le layout racine lui-même plante. Il remplace tout
// le document, donc il embarque ses propres <html>/<body> et ne peut pas compter sur les styles
// de l'app.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    journaliserErreur(error);
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F5F0E6',
          color: '#2B2B2E',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '1.5rem',
        }}
      >
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <p style={{ fontSize: 48, margin: 0 }}>🚧</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '12px 0 8px' }}>BTP Life est momentanément à l&apos;arrêt</h1>
          <p style={{ color: '#2B2B2Eaa', lineHeight: 1.5, margin: '0 0 20px' }}>
            Une erreur inattendue a interrompu l&apos;application. Ta progression est enregistrée côté
            serveur — recharge pour reprendre.
          </p>
          <button
            onClick={reset}
            style={{
              border: 'none',
              borderRadius: 999,
              background: '#C1502E',
              color: '#F5F0E6',
              padding: '12px 28px',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ↻ Recharger
          </button>
        </div>
      </body>
    </html>
  );
}
