/**
 * Puerto: de donde sale la credencial de la persona que entra.
 *
 * La sesion solo conoce este contrato; el adaptador de Google se conecta
 * fuera, y en las pruebas se sustituye por uno falso.
 */
export abstract class ProveedorDeIdentidad {
  /**
   * Pinta el acceso en el contenedor y avisa con la credencial cuando llega.
   * Si la senal se cancela antes de terminar (la pantalla ya no existe), no
   * pinta nada ni lanza avisos.
   */
  abstract preparar(
    contenedor: HTMLElement,
    alRecibir: (credencial: string) => void,
    cancelacion?: AbortSignal,
  ): Promise<void>;
  /** Deja de ofrecer el acceso y olvida la eleccion de cuenta. */
  abstract olvidar(): void;
}
