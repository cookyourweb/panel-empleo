import type { Page } from '@playwright/test';

/** JWT falso con payload real (cabecera/payload en base64url, firma inventada). */
export function tokenFalso(payload: object): string {
  const b64 = (o: object) =>
    btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${b64({ alg: 'RS256' })}.${b64(payload)}.firma`;
}

/**
 * Inyecta un `window.google` falso antes de que Angular arranque, para que
 * el flujo de login no dependa del script real de Google Identity Services.
 * Llama a esto en `test.beforeEach` antes de `page.goto`.
 */
export async function inyectarGoogleFalso(page: Page, email = 'test@ejemplo.com') {
  const credencial = tokenFalso({ email, name: 'Usuario Test', sub: '123', exp: 9999999999 });

  // Bloquear el script real de Google Identity Services para que no sobrescriba
  // nuestro mock de window.google.
  await page.route('**/accounts.google.com/gsi/client', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
  });

  await page.addInitScript((cred) => {
    const googleAccounts = {
      id: {
        initialize: (opts: { callback: (r: { credential: string }) => void }) => {
          // Guardar callback para dispararlo cuando se llame a prompt()
          (window as unknown as { __googleCallback?: (r: { credential: string }) => void }).__googleCallback = opts.callback;
        },
        renderButton: () => {},
        prompt: () => {
          const cb = (window as unknown as { __googleCallback?: (r: { credential: string }) => void }).__googleCallback;
          if (cb) cb({ credential: cred });
        },
        disableAutoSelect: () => {},
      },
    };
    (window as unknown as { google: { accounts: typeof googleAccounts } }).google = { accounts: googleAccounts };
  }, credencial);
}