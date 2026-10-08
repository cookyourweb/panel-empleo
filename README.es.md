# Panel de empleo

*[Read in English](README.md)*

**Un sistema de búsqueda de empleo que automatiza el trabajo repetitivo sin automatizar
las decisiones que son de quien busca.**

Este repositorio es su parte visible: un panel en Angular 22 donde cada candidatura vive
en un solo sitio, con su currículum, su carta y su seguimiento. Las ofertas, los
documentos adaptados y la búsqueda diaria ya corren en producción. El panel es donde
quien busca revisa y decide.

## De un vistazo

| Qué tiene de interesante técnicamente | Dónde verlo |
|---|---|
| Estado en signals, componentes standalone, `OnPush`, sin `zone.js` | [Decisiones de ingeniería](#decisiones-de-ingeniería) |
| Puertos hexagonales: las pantallas no saben de dónde salen los datos | [Por dentro](#por-dentro) |
| TDD con Vitest: 297 pruebas de componentes y 53 de tokens de diseño | [Desarrollo](#desarrollo) |
| Entrada por invitación: el token solo vive en memoria y un interceptor acotado lo envía a un único origen | [Inicio de sesión](#inicio-de-sesión) |
| Demo pública abierta a quien visita, con datos de ejemplo y sin inicio de sesión | [Pruébalo](#pruébalo) |
| Pruebas de contraste que leen la hoja de estilos del disco | [Las pruebas de contraste](#las-pruebas-de-contraste) |

## Pruébalo

| Modo | Comando | Datos | Inicio de sesión |
|---|---|---|---|
| Demo (lo que ve quien visita) | `npx ng serve --configuration production` | Datos de ejemplo incluidos en el proyecto | No |
| Desarrollo con datos reales | `npm start` | Ficheros locales y un puente local que no están en este repositorio | Sí |

La demo funciona nada más clonar. El modo de desarrollo necesita ficheros y un puente que
viven fuera de este repositorio público (mira [Desarrollo](#desarrollo)).

Buscar trabajo es, casi siempre, una colección de herramientas desconectadas. Las
ofertas aparecen en varias plataformas. Las candidaturas se apuntan en otro sitio. El
currículum vive en una carpeta, la preparación de la entrevista en otra, y el
seguimiento depende de la memoria.

El resultado es previsible: lo que lleva tiempo se salta. El mismo currículum va a todo,
la carta solo cambia el nombre de la empresa, y las ofertas se eligen por el título
porque leerlas todas no entra en las horas que hay. Sale peor y todo el mundo lo sabe.
Se hace igual, porque la alternativa es no mandar nada.

No es un problema de disciplina. **Es una herramienta para hacer una búsqueda rigurosa
sin que el tiempo que exige haga imposible ser riguroso.**

---

## El principio: adaptar, no inventar

> **Adaptar es elegir. Mentir es añadir.**

Un currículum adaptado pone delante otras partes de la experiencia real de la persona.
No inventa tecnologías ni convierte tres meses de roce en experiencia sólida. Está diseñado para no inventar: lo que añade se contrasta contra el currículum maestro y se avisa. La exageración del alcance de un rol todavía no se detecta de forma automática.

Cuando una oferta pide algo que la persona no tiene, el sistema nombra el hueco en vez
de taparlo. La regla que gobierna la adaptación lo dice con un criterio que se puede
comprobar:

> Un currículum adaptado no cambia quién eres. Cambia qué parte de tu experiencia pone
> en primer plano. Y la línea entre reposicionar e inventar no es lo que escribes: es si
> puedes defenderlo cuarenta minutos delante de alguien técnico.

Un ejemplo. Para una oferta de un dominio en el que la persona no ha trabajado, el
sistema no escribe «tengo experiencia en ese dominio», que sería mentira. Escribe que ha
trabajado en dominios donde un error tiene consecuencias reales, que sí es cierto y sí
se defiende.

Esto no es un matiz moral. Es la razón de que todo esté construido como está: cada
documento sale de un currículum maestro que escribió la propia persona. **Está diseñado para no inventar: lo que añade se contrasta contra el currículum maestro y se avisa. La exageración del alcance de un rol todavía no se detecta de forma automática.**

## Qué hace

```
Busca      en varias fuentes, una vez al día
Filtra     contra el perfil real de quien busca, no contra una palabra
Avisa      por correo: aprobar, descartar o remitir
Genera     currículum y carta adaptados, al aprobar
Envía      y lo registra en el mismo gesto
Sigue      qué pasó, cuándo, y a quién hay que insistir
```

Los cinco primeros pasos corren en producción. El último es lo que construye este
repositorio.

**El sistema automatiza el trabajo. La persona se queda con el criterio.** Nunca decide
si presentarse, y nunca manda nada por su cuenta.

## Lo que ya corre en producción

Desde julio de 2026, contra datos reales, cada mañana a las nueve. Un workflow de n8n de
unos cincuenta nodos busca, filtra, avisa y, en cuanto se aprueba una oferta, dispara la
generación de los documentos.

**Ofertas reales, aprendido a la fuerza.** Una versión anterior le pedía las ofertas a
un modelo de lenguaje. Devolvía ofertas que sonaban plausibles y no existían. Ahora
vienen de tres fuentes reales por API (Tecnoempleo, Adzuna y Remotive), filtradas por el
stack de cada persona, y se descartan las ya guardadas antes de que lleguen a la bandeja
de entrada.

**LinkedIn entra por otro camino, y es a propósito.** LinkedIn no ofrece API para esto,
así que entra por una tarea diaria en la que un agente con acceso al navegador abre la
oferta y rellena la ficha. Donde hay API se usa. Donde no la hay, un agente hace el
trabajo que haría una persona, una vez al día y con el alcance acotado, en lugar de
montar un raspado permanente que es frágil y pone en riesgo la cuenta. La lista de
fuentes crece añadiendo una fuente, no rehaciendo el sistema.

**El texto lo escribe un modelo. La verdad, no.** Generar el currículum y la carta vive
en un servicio aparte, `cv-server`, desplegado en Render, con sus propios guardrails
contra la exageración y casos de evaluación construidos con fallos reales de producción,
no imaginados. El currículum que escribe está pensado para pasar los filtros automáticos
de cribado que descartan por palabras y formato antes de que una persona lea nada. Se
pierde gente válida por cómo está escrito el documento, no por lo que sabe.

> Un modelo no falla con una excepción: devuelve algo verosímil y peor.

En producción, `cv-server` escribe el currículum y la carta con `claude-sonnet-4-6`.
Si Claude falla, entran `openai/gpt-oss-120b`, después Gemini y después Claude Haiku
4.5, y cada respuesta indica el modelo usado en `modelo_usado`.

**Los secretos no dependen de que nadie se acuerde.** Los webhooks de n8n ejecutan
acciones con efectos fuera del sistema, así que sus rutas no pueden vivir en un
repositorio público. Un verificador corre en el hook de pre-commit y en integración
continua, y falla en cuanto encuentra una. Se escribió después de descubrir que llevaban
meses publicadas.

> Una regla escrita no es un control. Un control es código que falla.

**El workflow se puede diferenciar.** Un export de n8n es un único JSON con cada nodo de
código metido dentro de un string escapado: un cambio de tres líneas es invisible en
`git diff`. Hay herramientas propias que lo parten en piezas legibles, lo rehacen y lo
verifican con ocho reglas que salieron de averías reales.

## Qué construye este repositorio

Hoy una sola candidatura vive repartida en cuatro sitios sin ningún enlace entre ellos:
la oferta y su estado en Notion, el currículum en Google Drive, la preparación de la
entrevista en una carpeta dentro de un repositorio git, y el seguimiento en la cabeza de
quien busca.

**No hay un sitio común. El panel está pensado para ser ese sitio.**

Y hay un dato medido que lo respalda. Los campos que el sistema rellena al captar la
oferta están presentes en más del ochenta por ciento de las filas. Los que hay que
escribir a mano tras cada contacto (la fase del proceso, el formato de la prueba
técnica, la fecha de la entrevista, el nombre de la persona con la que se habla) están
por debajo del quince por ciento. No están vacíos porque no importen. Están vacíos
porque rellenarlos obliga a salir del flujo y editar una fila a mano.

Si registrar algo cuesta menos que no registrarlo, el tablero se mantiene solo. Ese es
el criterio que decide qué se construye a continuación.

### Qué está construido y qué no

El panel ya tiene las pantallas que se usan cada día. La tabla, el panel lateral y la
ficha funcionan con datos de ejemplo en la demo pública. Las acciones, la edición y el
borrado solo funcionan con datos reales en desarrollo: la demo no los tiene activados.

| Pantalla | Qué se puede hacer |
|---|---|
| Tabla de candidaturas | Ordenar, buscar, elegir columnas (31 disponibles, la elección se guarda en `localStorage`), lo más reciente arriba |
| Panel lateral | Abrir una candidatura sin salir de la tabla y pasar a la anterior o a la siguiente |
| Ficha | Leer la oferta entera, el currículum y la carta incrustados, y el contenido de la página de Notion |
| Acciones | Aprobar, descartar y enviar, con los mismos enlaces que usa el correo diario |
| Edición | Cambiar los campos de una candidatura a través de un puente local a Notion |
| Selección | Elegir filas, mandarlas a la papelera de Notion, cambiar su estado y deshacer |
| Inicio de sesión | Entrar con una cuenta de Google invitada (mira [Inicio de sesión](#inicio-de-sesión)) |

Todavía sin construir:

- La vista de preparación de entrevista.
- Almacenamiento propio del panel. Postgres (Neon) está **planificado** (ADR-002 del
  [repositorio del sistema](https://github.com/cookyourweb/buscartrabajo)), no
  implementado.
- Un despliegue público con datos reales. Los datos reales solo aparecen en desarrollo,
  detrás del inicio de sesión.

## Inicio de sesión

Añadido el 7 de octubre de 2026. Protege los datos reales y deja la demo abierta.

| Pieza | Qué hace |
|---|---|
| `ProveedorDeIdentidad` (puerto) e `IdentidadGoogle` (adaptador) | Entra con Google Identity Services. El panel no sabe qué proveedor hay detrás del puerto |
| `Sesion` | Guarda el token solo en memoria. Nunca lo escribe en `localStorage` ni en cookies, así que recargar la página cierra la sesión |
| `Servidor` | Comprobación de salud de `cv-server`, para detectar un arranque en frío |
| `soloConSesion` | Guarda funcional de rutas: sin sesión no hay panel |
| `conToken` | Interceptor HTTP. Añade `Authorization: Bearer` **solo** al origen de `cv-server`, nunca al puente local ni a terceros, y ante un `401` cierra la sesión y vuelve a la entrada |
| Página de entrada | Muestra un aviso de arranque en frío a los 3 segundos (el servidor gratuito se duerme) y ofrece reintentar a los 90 |

`cv-server` valida el token en `GET /yo` y comprueba la cuenta contra una lista de
invitadas. El id de cliente de Google de `src/app/sesion/configuracion.ts` es público a
propósito: no es un secreto, y Google lo protege con los orígenes autorizados de su
consola.

La guarda solo se aplica con datos reales (`elegirGuardas(isDevMode())`). La build de la
demo no tiene guarda, porque no hay nada que proteger.

---

## Internacionalización

El panel viene en español (el idioma de origen) e inglés, con el `@angular/localize`
oficial de Angular. Se resuelve al compilar: una build por idioma, servida bajo `/es/` y
`/en/`, sin código de traducción en tiempo de ejecución. `/` redirige según la cabecera
`Accept-Language` (mira `vercel.json`), y un selector en la cabecera enlaza a la misma
pantalla bajo el otro prefijo.

- **Qué se traduce:** la interfaz (títulos, botones, etiquetas, cabeceras de columna,
  mensajes, `aria-label`, títulos de ruta). Los datos (ofertas, empresas, descripciones)
  siguen en español a propósito: son datos de ejemplo, no interfaz.
- **Fechas, números y orden alfabético** siguen a `LOCALE_ID`. Nada lleva un idioma
  escrito a mano.
- **Cada mensaje tiene un id escrito a mano** (`@@area.nombre`). Un id generado cambia al
  corregir una errata y deja la traducción huérfana sin avisar.

**Añadir un idioma:**

1. Declararlo en `angular.json`, en `i18n.locales` (su fichero `translation` y su
   `subPath`), y en `src/app/idioma/idiomas.ts`, con su nombre escrito en ese idioma.
2. Ejecutar `npx ng extract-i18n --format xlf2 --output-path src/locale` para refrescar
   `src/locale/messages.xlf`, el origen.
3. Copiarlo a `src/locale/messages.<codigo>.xlf`, añadir `trgLang` a la cabecera y un
   `<target>` a cada unidad.
4. Añadir en `vercel.json` un rewrite para el prefijo nuevo, y una regla de redirección
   si `Accept-Language` debe elegirlo.

**La prueba de completitud.** Con una build por idioma, una traducción que falta se queda
en español sin avisar. `tools/i18n.test.ts` lee `angular.json` y, para cada idioma, falla
si un mensaje no tiene traducción, si un destino está vacío, si se perdió un marcador, si
sobra un mensaje obsoleto o si `messages.xlf` no está al día con los ids del código. Un
idioma nuevo se comprueba sin tocar la prueba. `tools/vercel.test.ts` hace lo mismo con el
enrutado por idioma y la redirección.

**En local:** `npm start` y `npx ng serve --configuration production` sirven español, y
`npx ng serve --configuration production-en` sirve inglés. El servidor de desarrollo sirve
un idioma cada vez, así que el selector de la cabecera solo funciona ya desplegado.

## Decisiones de ingeniería

**Angular 22 sin `zone.js`, con signals y componentes standalone.** La detección de
cambios va por signals, que es como se escribe Angular hoy.

**Puertos hexagonales.** `RepositorioDeCandidaturas`, `FuenteDeAcciones`,
`EditorDeCandidaturas` y `ProveedorDeIdentidad` son clases abstractas. Cada una tiene un
adaptador de demo o local y la aplicación elige uno según el modo, así que las mismas
pantallas funcionan con datos de ejemplo, con datos reales o en los tests.

**Vitest.** Es el runner por defecto desde Angular 22, y Karma está en las últimas.

**El design system no se inventa aquí.** Son los tokens de marca de CookYourWeb, medidos
en OKLCh y ya probados en el sitio de la agencia. Viajan con sus veintiséis pruebas de
contraste.

**Se copian, no se comparten en una librería.** Todavía no. Con un consumidor vivo y
otro por nacer, la frontera entre lo común y lo propio de cada producto se dibujaría
adivinando, y una frontera mal puesta cuesta más que copiar. Se extraerán cuando haya
dos casos reales delante. Una abstracción se descubre, no se inventa.

**Multiusuario desde el diseño.** El problema no es de una persona, así que el sistema
no se construye para una. No hay un «cuando abramos el multiusuario»: añadir el
aislamiento después obliga a migrar datos y a tocar todas las consultas, y basta olvidar
una para filtrar datos ajenos.

## Las pruebas de contraste

Cada par de color del sistema se comprueba con la fórmula de luminancia relativa de
WCAG. Si un par de texto baja de 4,5:1, o un borde o un anillo de foco bajan de 3:1, la
suite falla.

Leen `src/styles.css` **del disco**, no una copia de los valores. Esa diferencia es
todo: con los valores copiados en el test, la suite pasaría siempre, aunque el panel se
viera ilegible.

No son una formalidad. Al aplicarlas sobre el sitio de la agencia, del que salen estos
tokens, encontraron tres defectos que llevaban meses ahí y que mirando la pantalla no se
ven: un rojo de error a 3,59:1 y bordes a 2,90:1 en tema oscuro y 1,42:1 en claro. El
tercero venía de una regla equivocada en la propia documentación de diseño, escrita con
datos medidos.

> El ojo se adapta. El contraste se calcula.

## Arquitectura

| Pieza | Papel | Estado |
|---|---|---|
| n8n | Busca, filtra, avisa y dispara la generación | En producción |
| Notion | Donde hoy se guardan las ofertas y su estado | En producción |
| `cv-server` | Escribe currículum y carta, valida la entrada | En producción |
| Este panel | Revisa y decide | Pantallas construidas, mira arriba |
| Postgres | Futuro almacén de datos del panel | Planificado (ADR-002) |

n8n escribe en Notion y llama a `cv-server`. El panel habla con `cv-server` para la
entrada. En desarrollo, además, lee ficheros locales y usa un puente local a Notion. El
panel no llega a Notion, ni a Drive, ni a un modelo de lenguaje desde el navegador: el
navegador no ve jamás una credencial de terceros.

### Por dentro

```
src/app/ofertas/
  dominio.ts                      Oferta, Candidatura y los nueve estados
  repositorio-de-candidaturas.ts  de dónde salen, como clase abstracta
  candidaturas.store.ts           el estado en signals y el recuento por estado
  ofertas.page.ts, detalle.page.ts  la tabla y la ficha
  editor-de-candidaturas.ts       edición a través del puente local
  fuente-de-acciones.ts           enlaces de aprobar, descartar y enviar
src/app/sesion/                   entrada: puerto, adaptador de Google, sesión en
                                  memoria, guarda e interceptor
src/app/entrada/                  la página de entrada
tools/design-system/              fórmula de contraste y lector de tokens, en Node
```

Una `Oferta` describe un puesto y no lleva estado. El estado es de la `Candidatura`: una
oferta puede existir sin que nadie se presente, y dos personas pueden presentarse a la
misma y estar en puntos distintos.

`RepositorioDeCandidaturas` es la costura de la que cuelga todo. La aplicación depende
de esa clase abstracta y nunca de una fuente concreta. Eso es lo que permite que la demo
pública funcione con datos de ejemplo incluidos en el propio front, sin backend vivo
detrás, y que los tests corran sin red.

Es una clase abstracta y no una interfaz de TypeScript a propósito: las interfaces
desaparecen al compilar, y la inyección de dependencias necesita algo que exista en
tiempo de ejecución.

El estado vive en signals y el store los expone en solo lectura. El recuento por estado
es un `computed`: se deriva de las candidaturas, así que no puede desincronizarse de
ellas.

## Cómo se trabaja

Una prueba que falla, la pieza mínima que la pone en verde, y commit. Los mensajes de
commit explican por qué se hizo algo, no qué se tocó: eso ya lo dice el diff.

Entrega por rebanadas verticales completas, no por capas. La primera vale por sí sola:
ver las ofertas, abrir una, generar currículum y carta, descargar. La segunda cierra el
seguimiento, que es el problema de arriba.

Desde el 8 de octubre de 2026 los mensajes de commit y los comentarios del código van en inglés
(ver [CONTRIBUTING](CONTRIBUTING.md)). El historial anterior y los documentos de diseño están
en español, el idioma en que se pensó el razonamiento.

## Desarrollo

Requiere Node 22, fijado en `.nvmrc`.

```bash
nvm use
npm ci
npx ng serve --configuration production   # demo: datos de ejemplo, sin inicio de sesión
npm start                                 # desarrollo: datos reales, con inicio de sesión
npx ng test --watch=false                 # 297 pruebas de componentes
npm test                                  # esas 297 más 53 de tokens de diseño
```

### Datos reales en desarrollo

`npm start` lee las candidaturas reales de `public/local/candidaturas.json`, que está en
`.gitignore`, y redirige `/api` a un puente local en `127.0.0.1:4300`. El script que crea
ese fichero y el puente viven en un repositorio **privado**, así que quien clone este no
los tiene. Sin ellos, usa la demo.

### Inicio de sesión en desarrollo

`cv-server` debe correr en `localhost:5000` con estas variables de entorno:
`OIDC_AUDIENCIA`, `OIDC_EMISORES`, `OIDC_JWKS_URL`, `INVITADAS` y
`CORS_ORIGENES=http://localhost:4200`. Mira el
[repositorio de `cv-server`](https://github.com/cookyourweb/cv-server) y su
`.env.example` para saber qué significa cada una.

### Pruebas

Las pruebas van en dos runners a propósito. Las de componentes corren en un navegador;
las de contraste leen la hoja de estilos del disco y corren en Node. Mezclarlas
obligaría a compilar código de sistema de ficheros para el navegador, que no es donde
vive.

## Documentación

Las decisiones y su porqué viven en el repositorio del sistema, no en una herramienta de
proveedor:

- [Decisiones de arquitectura](https://github.com/cookyourweb/buscartrabajo/blob/develop/docs/diseno/2026-09-05-decisiones-arquitectura.md).
  Lo que está cerrado, lo que se decide por defecto y lo que hay que discutir de verdad.
  Cada entrada dice por qué, y qué costaría cambiarla después.
- [Diseño del panel](https://github.com/cookyourweb/buscartrabajo/blob/develop/docs/diseno/2026-09-05-panel-empleo-angular-design.md).
  Alcance, modelo de datos, rebanadas de entrega y una lista explícita de lo que queda
  fuera.
- [Tokens del design system](https://github.com/cookyourweb/buscartrabajo/blob/develop/docs/diseno/2026-09-05-tokens-design-system.md).
  Las cuatro rampas de marca, su contraste medido y la regla de uso.
- [Plan de arranque](https://github.com/cookyourweb/buscartrabajo/blob/develop/docs/diseno/2026-09-06-plan-arranque-panel-angular.md).
  Cómo encajan las piezas y las reglas que las mantienen separadas.

## Licencia

[PolyForm Noncommercial 1.0.0](LICENSE). Puedes leer, estudiar y usar este código para fines personales, de aprendizaje u otros no comerciales. El uso comercial, como venderlo, ofrecerlo como servicio o usarlo en una empresa con ánimo de lucro, necesita permiso: escribe a través de [cookyourwebai.es](https://cookyourwebai.es).
