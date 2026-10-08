/**
 * Los nombres de los campos de una candidatura, en un solo sitio.
 *
 * La tabla, la ficha y el formulario de edicion nombran los mismos campos: si
 * cada una tuviera su copia, habria que traducir lo mismo tres veces y acabarian
 * diciendo cosas distintas. Las que difieren solo en el texto en español
 * (Tipo contrato, Tipo de contrato) tienen cada una su clave, porque una
 * traduccion sale de cada texto original.
 */
export const ETIQUETAS = {
  empresa: $localize`:Nombre de campo@@campo.empresa:Empresa`,
  puesto: $localize`:Nombre de campo@@campo.puesto:Puesto`,
  estado: $localize`:Nombre de campo@@campo.estado:Estado`,
  fase: $localize`:Nombre de campo@@campo.fase:Fase`,
  modalidad: $localize`:Nombre de campo@@campo.modalidad:Modalidad`,
  ubicacion: $localize`:Nombre de campo@@campo.ubicacion:Ubicación`,
  salario: $localize`:Nombre de campo@@campo.salario:Salario`,
  viaEnvio: $localize`:Nombre de campo@@campo.viaEnvio:Vía envío`,
  fechaEnvio: $localize`:Nombre de campo@@campo.fechaEnvio:Fecha envío`,
  fechaPublicacion: $localize`:Nombre de campo@@campo.fechaPublicacion:Publicada`,
  enlaceDeOferta: $localize`:Columna con el enlace a la oferta@@campo.enlaceDeOferta:Oferta`,
  linkOferta: $localize`:Campo del formulario con la direccion de la oferta@@campo.linkOferta:Link oferta`,
  seguimiento: $localize`:Nombre de campo@@campo.seguimiento:Seguimiento`,
  descripcion: $localize`:Nombre de campo@@campo.descripcion:Descripción`,
  tipoContratoCorto: $localize`:Nombre de campo, version corta de la tabla@@campo.tipoContratoCorto:Tipo contrato`,
  tipoContrato: $localize`:Nombre de campo@@campo.tipoContrato:Tipo de contrato`,
  modoContratacionCorto: $localize`:Nombre de campo, version corta de la tabla@@campo.modoContratacionCorto:Modo contratación`,
  modoContratacion: $localize`:Nombre de campo@@campo.modoContratacion:Modo de contratación`,
  idioma: $localize`:Nombre de campo@@campo.idioma:Idioma`,
  palabrasClave: $localize`:Nombre de campo@@campo.palabrasClave:Palabras clave`,
  verificada: $localize`:Nombre de campo@@campo.verificada:Verificada`,
  tags: $localize`:Nombre de campo@@campo.tags:Tags`,
  fechaEntrevista: $localize`:Nombre de campo@@campo.fechaEntrevista:Fecha entrevista`,
  formatoTecnico: $localize`:Nombre de campo@@campo.formatoTecnico:Formato técnico`,
  nombreContacto: $localize`:Nombre de campo@@campo.nombreContacto:Nombre contacto`,
  telefonoContacto: $localize`:Nombre de campo@@campo.telefonoContacto:Teléfono contacto`,
  emailEmpresa: $localize`:Nombre de campo@@campo.emailEmpresa:Email empresa`,
  emailEnviado: $localize`:Nombre de campo@@campo.emailEnviado:Email enviado`,
  notas: $localize`:Nombre de campo@@campo.notas:Notas`,
  cvUsado: $localize`:Nombre de campo@@campo.cvUsado:CV usado`,
  cv: $localize`:Columna del CV enviado@@campo.cv:CV`,
  cvGenerado: $localize`:Nombre de campo@@campo.cvGenerado:CV generado`,
  cvGeneradoEnlace: $localize`:Campo del formulario@@campo.cvGeneradoEnlace:CV generado (enlace)`,
  carta: $localize`:Columna de la carta@@campo.carta:Carta`,
  cartaDePresentacion: $localize`:Nombre de campo@@campo.cartaDePresentacion:Carta de presentación`,
  prep: $localize`:Columna de la preparacion de la entrevista@@campo.prep:Prep`,
  preparacion: $localize`:Nombre de campo@@campo.preparacion:Preparación`,
  preparacionEnlace: $localize`:Campo del formulario@@campo.preparacionEnlace:Preparación (enlace)`,
  avisoAutonoma: $localize`:Columna@@campo.avisoAutonoma:Aviso autónoma`,
  avisoAutonomaEnCarta: $localize`:Nombre de campo@@campo.avisoAutonomaEnCarta:Aviso autónoma en carta`,
} as const;

/** Lo que se lee en una celda de enlace, en vez de la direccion. */
export const TEXTOS_DE_ENLACE = {
  abrir: $localize`:Texto de un enlace de la tabla@@enlace.abrir:Abrir`,
  ver: $localize`:Texto de un enlace de la tabla@@enlace.ver:Ver`,
  abrirCv: $localize`:Texto de un enlace de la ficha@@enlace.abrirCv:Abrir CV`,
  abrirCvBase: $localize`:Texto de un enlace de la ficha@@enlace.abrirCvBase:Abrir CV base`,
  abrirPrep: $localize`:Texto de un enlace de la ficha@@enlace.abrirPrep:Abrir prep`,
} as const;

/** El idioma en que esta escrita la oferta, dicho en el idioma de la pantalla. */
export const IDIOMAS_DE_OFERTA = {
  es: $localize`:Idioma de una oferta@@idiomaDeOferta.es:Español`,
  en: $localize`:Idioma de una oferta@@idiomaDeOferta.en:Inglés`,
} as const;

/** Una casilla marcada, tal como se lee en la tabla y en la ficha. */
export const SI = $localize`:Casilla marcada@@casilla.si:Sí`;

/** Los grupos en que se reparten columnas y campos. Las claves son las del catalogo. */
export const TITULOS_DE_GRUPO = {
  Oferta: $localize`:Grupo de campos@@grupo.oferta:Oferta`,
  Candidatura: $localize`:Grupo de campos@@grupo.candidatura:Candidatura`,
  Documentos: $localize`:Grupo de campos@@grupo.documentos:Documentos`,
  Cabecera: $localize`:Grupo del formulario de edicion@@grupo.cabecera:Oferta: lo principal`,
} as const;
