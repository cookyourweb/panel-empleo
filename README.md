# Panel de empleo

Una herramienta para desarrolladores que están buscando empresa.

## El problema

Buscar trabajo como desarrollador es, en la práctica, gestionar decenas de procesos
abiertos a la vez. Y cada uno pide lo mismo: leer la oferta, decidir si encaja, adaptar
el currículum a lo que pide de verdad, escribir una carta que no sea plantilla, enviar,
y acordarse de a quién hay que dar seguimiento y cuándo.

Las herramientas que existen resuelven media pieza. Los portales publican ofertas pero
no ayudan a preparar la candidatura. Una hoja de cálculo o un tablero genérico registra
estados, pero no sabe nada de currículums ni de cartas: hay que rellenarlo a mano,
siempre, y en el peor momento, que es justo después de enviar.

Y ahí está el fallo que lo rompe todo: **cuando registrar algo cuesta más que hacerlo,
la gente hace lo segundo y se salta lo primero**. Y hace bien. El resultado es un
tablero que dice «pendiente» sobre candidaturas enviadas hace semanas. Deja de describir
la realidad, y con él se pierde lo único que importaba: saber a quién hay que insistir,
qué se contestó y qué está muerto.

No es un problema de disciplina. Es un problema de diseño.

## Qué hace este panel

Junta las dos mitades. Las ofertas captadas llegan solas, la generación del currículum
y la carta adaptados ocurre desde la misma pantalla donde se está mirando la oferta, y
el estado se actualiza como consecuencia de lo que ya estabas haciendo, no como una
tarea aparte.

El criterio de diseño es uno y se aplica a todo: **si registrar cuesta menos que no
registrar, el tablero se mantiene solo.** Marcar una candidatura como enviada tiene que
costar un clic, sin salir a ningún sitio.

Detrás hay un sistema que ya funciona: n8n capta las ofertas y un servicio en FastAPI
genera los documentos adaptados. Este proyecto es su cara.

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
