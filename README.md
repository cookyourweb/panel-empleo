# Panel de empleo

Busca las ofertas mejor pagadas en varios sitios y te avisa por correo: tú solo aceptas
o rechazas. Si aceptas, prepara el currículum para esa oferta y, si te falta algo, no
miente: te ayuda a aprenderlo.

## El problema

Preparar bien una candidatura lleva casi una hora: leer la oferta entera, decidir si
encaja, adaptar el currículum, escribir una carta que no suene a plantilla y enviarla
donde corresponda.

Quien busca trabajo no tiene esa hora, y menos multiplicada por los sitios donde hay
que mirar: LinkedIn, Tecnoempleo, Adzuna, Remotive, el portal de cada empresa, cada uno
con su manera distinta de buscar y de avisar.

Así que se recorta. El mismo currículum va a todo, la carta solo cambia el nombre de
la empresa, y las ofertas se eligen por el título porque leerlas todas no entra en las
horas que hay. Sale peor y todo el mundo lo sabe. Se hace igual: la alternativa es no
mandar nada.

Y lo primero que se pierde es el registro. Un tablero que dice «pendiente» sobre
candidaturas enviadas hace semanas deja de servir para lo único que importaba: saber a
quién insistir, qué se contestó y qué está muerto.

No es un problema de disciplina. Es un problema de tiempo: hace falta uno para cada
sitio, y solo hay uno para todos.

## Qué hace

Busca las ofertas mejor pagadas, en varios sitios a la vez, y avisa por correo. Tú
solo aceptas o rechazas.

### Primero, quién eres

Un formulario, una sola vez. Se rellena con el currículum maestro, el completo y sin
recortar, los puestos a los que se puede optar, y las condiciones: sueldo, si se busca
remoto, híbrido o presencial, y en qué idiomas se puede trabajar.

Ese currículum maestro es **la fuente de verdad de esa persona**. Todo lo que el
sistema escriba después sale de ahí y de ningún otro sitio.

De ese detalle depende lo demás. Sin el perfil real, «las ofertas que encajan contigo»
no significa nada, y la regla de no mentir sería una promesa de buena voluntad en vez
de una consecuencia de cómo está construido el sistema. No hay de dónde sacar lo que
no existe.

### Después, el ciclo

1. **Busca por sueldo, en varios sitios a la vez.** El dinero es un criterio de
   búsqueda, no un dato que se mira después de todo lo demás.
2. **Avisa por correo.** No hace falta entrar a ningún sitio a comprobar si ha
   llegado algo nuevo.
3. **Aceptas o rechazas.** Esa es toda la decisión que se pide: dos opciones, un
   gesto.
4. **Si aceptas, genera el currículum para esa oferta concreta**, pensado para pasar
   los filtros automáticos de cribado que descartan por palabras y formato antes de
   que una persona lea nada. Se pierde gente válida por cómo está escrito el
   documento, no por lo que sabe.
5. **Y la pieza que cambia todo lo demás: no miente para encajar.** Si a la persona
   le falta algo que la oferta pide, el sistema lo dice y la orienta para
   aprenderlo, en vez de inflar el currículum como hace el resto del sector.

### La regla que no se rompe: sin mentir

Cuando a alguien le falta algo que la oferta pide, la respuesta habitual del sector es
inflar: poner la tecnología que no se tiene, convertir un «colaboré en» en un
«lideré», estirar tres meses hasta que parezcan experiencia sólida. Suena mejor y es
mentira.

Aquí la respuesta cambia: **cuando falta algo, los demás mienten; aquí se aprende.**
El sistema señala qué falta y orienta para cerrarlo, en vez de disfrazarlo en el
currículum.

Eso no es un matiz moral. La regla que gobierna la adaptación del currículum lo dice
con un criterio que se puede comprobar:

> Un currículum adaptado no cambia quién eres. Cambia qué parte de tu experiencia pone
> en primer plano. Y la línea entre reposicionar e inventar no es lo que escribes: es
> si puedes defenderlo cuarenta minutos delante de alguien técnico.

Un ejemplo de la diferencia. Para una oferta de un dominio en el que la persona no ha
trabajado, el sistema no escribe «tengo experiencia en ese dominio», que sería mentira.
Escribe que ha trabajado en dominios donde un error tiene consecuencias reales, que sí
es cierto y sí se defiende. Reposicionar es legítimo. Inventar no.

Adaptar es elegir. Mentir es añadir.

### De dónde salen las ofertas

Tecnoempleo, Adzuna y Remotive entran por workflows programados contra sus API.
LinkedIn no ofrece una API para esto, así que entra por otro camino: una tarea diaria
en la que un agente con acceso al navegador abre la oferta y rellena la ficha.

Esa asimetría es deliberada. Donde hay una API se usa; donde no la hay, un agente hace
el trabajo que haría una persona, una vez al día y con el alcance acotado, en lugar de
montar un raspado permanente que es frágil y pone en riesgo la cuenta.

**La lista de fuentes crece.** Añadir un portal es añadir un origen, no rehacer el
sistema.

### El criterio de diseño

Uno, y se aplica a todo: **si registrar cuesta menos que no registrar, el tablero se
mantiene solo.**

Detrás hay un sistema que ya funciona: la captación descrita arriba y un servicio en
FastAPI que genera los documentos adaptados con los guardrails puestos. Este proyecto
es su cara.

**Estado: en construcción.** Hay andamiaje, design system y pruebas. Todavía no hay
pantallas.

## Decisiones

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

El ojo se adapta. El contraste se calcula.

## Cómo se trabaja

Una prueba que falla, la pieza mínima que la pone en verde, y commit. Los mensajes de
commit explican por qué se hizo algo, no qué se tocó: eso ya lo dice el diff.

Entrega por rebanadas verticales completas, no por capas. La primera vale por sí sola:
ver las ofertas, abrir una, generar currículum y carta, descargar. La segunda cierra el
seguimiento, que es el problema de arriba.

## Ejecutar

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

## Arquitectura

```
n8n  ->  Notion
                \
                 '->  cv-server (FastAPI)  <-  este panel
                          |
                          '->  Postgres, Drive, modelos
```

El panel habla solo con `cv-server`. Nunca con Notion, ni con Drive, ni con un modelo de
lenguaje: el navegador no ve jamás una credencial de terceros.

## Documentación

Las decisiones y su porqué viven en el repositorio del sistema, no en una herramienta de
proveedor:

- [Diseño del panel](https://github.com/cookyourweb/buscartrabajo/blob/develop/docs/diseno/2026-09-05-panel-empleo-angular-design.md)
- [Tokens del design system](https://github.com/cookyourweb/buscartrabajo/blob/develop/docs/diseno/2026-09-05-tokens-design-system.md)
