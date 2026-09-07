# Panel de empleo

*[Read in English](README.md)*

**Un sistema de búsqueda de empleo que automatiza el trabajo repetitivo sin automatizar
las decisiones que son de quien busca.**

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
No inventa tecnologías, no estira responsabilidades y no convierte tres meses de roce en
experiencia sólida.

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
documento sale de un currículum maestro que escribió la propia persona. **No hay de
dónde sacar lo que no existe.**

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

Modelos distintos para tareas distintas: el currículum lo escribe `claude-haiku-4-5`, la
carta `claude-sonnet-4-6`.

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

El panel todavía no tiene pantallas de producto. Decir lo contrario dejaría este
documento peor que no tenerlo.

Construido hasta ahora:

- El andamiaje de una aplicación Angular 22 con signals y componentes standalone.
- Un design system heredado del sitio de la agencia, con sus pruebas de contraste.
- El dominio (`Oferta`, `Candidatura`, los ocho estados) separado de cualquier fuente
  concreta de datos.
- Una pantalla: una lista con filtros, sobre datos de ejemplo incluidos en el proyecto.

Todavía sin construir:

- Cualquier conexión con `cv-server` o con datos en vivo. La lista corre solo sobre
  datos de ejemplo.
- Aprobar o descartar desde el panel en vez de desde el correo.
- Cualquier pantalla más allá de la lista: ni detalle de candidatura, ni preparación de
  entrevista.

---

## Decisiones de ingeniería

**Angular 22 sin `zone.js`, con signals y componentes standalone.** La detección de
cambios va por signals, que es como se escribe Angular hoy.

**Vitest.** Es el runner por defecto desde Angular 22, y Karma está en las últimas.

**El design system no se inventa aquí.** Son los tokens de marca de CookYourWeb, medidos
en OKLCh y ya probados en el sitio de la agencia. Viajan con sus veinticuatro pruebas de
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

```
n8n  ->  Notion
                \
                 '->  cv-server  <-  este panel
                          |
                          '->  Postgres, Drive, modelos
```

El panel habla solo con `cv-server`. Nunca con Notion, ni con Drive, ni con un modelo de
lenguaje: el navegador no ve jamás una credencial de terceros.

### Por dentro

```
src/app/ofertas/
  dominio.ts                      Oferta, Candidatura y los ocho estados
  repositorio-de-candidaturas.ts  de dónde salen, como clase abstracta
  candidaturas.store.ts           el estado en signals y el recuento por estado
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

Los mensajes de commit y los documentos de diseño van en español. Son el razonamiento de
la autora, y se leen mejor en el idioma en que se pensaron.

## Desarrollo

Requiere Node 22, fijado en `.nvmrc`.

```bash
nvm use
npm ci
npm start          # servidor de desarrollo
npm test           # pruebas de componentes y de contraste
npm run build
```

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
