# Panel de empleo

Una herramienta para desarrolladores que están buscando empresa.

## El problema

Preparar bien una candidatura lleva cerca de una hora: leer la oferta entera, decidir si
encaja de verdad, reordenar el currículum hacia lo que piden, escribir una carta que no
suene a plantilla y enviarla por donde toque.

Con quince procesos abiertos a la vez, no hay quince horas. Y quien busca trabajo casi
nunca busca desde la calma: busca mientras trabaja, o mientras se le acaba el paro.

Así que se recorta. Se manda el mismo currículum a todo, la carta se copia y se cambia
el nombre de la empresa, y las ofertas se eligen por el título porque leerlas todas es
inviable. Todo el mundo sabe que así se convierte peor. Se hace igual, porque la
alternativa es no mandar nada.

Y la parte que se cae primero es el registro. Las herramientas que existen resuelven
media pieza cada una: los portales publican ofertas pero no ayudan a preparar la
candidatura; una hoja de cálculo guarda estados pero no sabe nada de currículums, así
que hay que rellenarla a mano justo después de enviar, que es el peor momento posible.

**Cuando registrar algo cuesta más que hacerlo, la gente hace lo segundo y se salta lo
primero.** Y hace bien. El resultado es un tablero que dice «pendiente» sobre
candidaturas enviadas hace semanas: deja de describir la realidad, y con él se pierde lo
único que importaba, que es saber a quién insistir, qué se contestó y qué está muerto.

No es un problema de disciplina. Es un problema de diseño.

## Qué hace

Que la persona reciba en su correo las ofertas que de verdad encajan con ella, con el
currículum y la carta ya preparados para cada una, y que enviar sea un botón.

Cuatro cosas, en ese orden:

1. **Filtrar de verdad.** No listar todo lo que existe: traer lo que encaja con el
   perfil concreto de quien busca. Una oferta que no encaja cuesta tiempo aunque se
   descarte en diez segundos, y hay decenas cada día.
2. **Avisar donde la persona ya mira.** Al correo. Una herramienta que exige entrar
   cada mañana a mirar se deja de usar en dos semanas.
3. **Preparar los documentos.** Currículum adaptado a lo que esa oferta pide de verdad,
   y carta de presentación escrita para esa empresa.
4. **Enviar y registrar en el mismo gesto.** El estado se actualiza como consecuencia de
   enviar, no como una tarea aparte que hay que acordarse de hacer después.

### La regla que no se rompe: sin mentir

Un generador de currículums con un modelo de lenguaje detrás tiende a inflar. Pone la
tecnología que la oferta pide aunque la persona no la tenga, asciende un «colaboré en» a
un «lideré», convierte tres meses en experiencia sólida. Suena mejor y es mentira.

Eso no es un detalle ético abstracto: **te revienta en la entrevista técnica**, delante
de alguien que sí sabe. Y con ello se va la candidatura y la reputación.

El sistema adapta, que es otra cosa: elige qué destacar de lo que la persona sí tiene,
lo ordena según lo que esa oferta valora y lo escribe en su idioma. Nunca añade lo que
no está. Hay validaciones que revisan lo generado antes de que llegue a la persona, y
cuando la oferta no da información suficiente, el sistema lo dice en vez de rellenar el
hueco inventando.

Adaptar es elegir. Mentir es añadir.

### El criterio de diseño

Uno, y se aplica a todo: **si registrar cuesta menos que no registrar, el tablero se
mantiene solo.**

Detrás hay un sistema que ya funciona: n8n capta las ofertas y un servicio en FastAPI
genera los documentos adaptados con los guardrails puestos. Este proyecto es su cara.

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
