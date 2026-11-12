import { test, expect } from '@playwright/test';

test('la app carga y muestra la pantalla de entrada', async ({ page }) => {
  await page.goto('/');
  // La app debe renderizar algo (no pantalla en blanco)
  await expect(page.locator('body')).not.toBeEmpty();
  // Debe haber un titulo o encabezado visible
  await expect(page).toHaveTitle(/.+/);
});
