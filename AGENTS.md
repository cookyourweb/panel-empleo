# Agents

The rules of this project are in **[CONTRIBUTING.md](CONTRIBUTING.md)**.

SDD activo:
- Lee `docs/constitution.md` y la spec activa antes de tocar código.
- Tests: `npm test`
- Verificación con Chrome DevTools, incluyendo móvil.
- No mezclar lógica de cuota/auth sin pruebas.
- SSE de búsqueda: `BusquedaProgresoService` (src/app/busqueda/) consume `GET /buscar-para-usuaria/progress?token=<jwt>`. Token en URL (EventSource no envía cabeceras). Cerrar conexión en done/error/ngOnDestroy.