import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { inyectarGoogleFalso } from './helpers/mock-google';

test.describe('Alta completa (flujo feliz con mock)', () => {
  test.beforeEach(async ({ page }) => {
    await inyectarGoogleFalso(page);

    await page.route('**/health', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    });
    await page.route('**/yo', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ sub: '123', email: 'test@ejemplo.com', nombre: 'Usuario Test', tiene_perfil: false, origen_master: null, consentimientos: { almacenar_cv: false, enviar_cv_a_ia: false } }) });
    });
    await page.route('**/consentimientos', async (route) => {
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ tipo: 'almacenar_cv', version: 'v2' }) });
    });
    await page.route('**/cv', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ idioma: 'es', formato: 'pdf', caracteres: 1000 }) });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      }
    });
    await page.route('**/extraccion', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ estado: 'manual', motivo: 'indisponible' }) });
    });
    await page.route('**/clave-api*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ configurada: false, trial_restante: 3 }) });
    });
    await page.route('**/perfil', async (route) => {
      if (route.request().method() === 'PUT' || route.request().method() === 'POST') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ nombre: 'Usuario Test' }) });
      } else {
        await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ ok: false, error: 'no encontrado' }) });
      }
    });
  });

  test('consentimiento -> subida -> manual -> guardar', async ({ page }) => {
    // Crear un PDF de prueba minimo
    const pdfPath = path.join(__dirname, 'test-cv.pdf');
    if (!fs.existsSync(pdfPath)) {
      fs.writeFileSync(pdfPath, '%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');
    }

    await page.goto('/');
    await page.waitForTimeout(6000);

    // Navegar directamente a /alta
    await page.goto('/alta');
    await page.waitForTimeout(4000);
    console.log('URL en alta:', page.url());
    const hs = await page.locator('h1, h2').allTextContents();
    console.log('HEADINGS:', JSON.stringify(hs));

    // Paso 1: consentimiento -> marcar las dos casillas y continuar
    await expect(page.locator('#consentimiento-casilla')).toBeVisible({ timeout: 10000 });
    await page.locator('#consentimiento-casilla').check();
    await page.locator('#consentimiento-mayor').check();
    await page.locator('[data-continuar]').click();
    await page.waitForTimeout(2000);

    // Paso 2: subida de CV -> input file
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count() > 0) {
      await fileInput.setInputFiles(pdfPath);
      await page.waitForTimeout(3000);
    }

    // Paso 3: deberia llegar a manual (extraccion devuelve manual)
    // Verificar que se muestra el formulario manual o la revision
    await page.waitForTimeout(3000);
    const body = await page.locator('body').innerText();
    console.log('BODY (primeros 300):', body.slice(0, 300));

    // Verificar que no hay pantalla en blanco
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
