/**
 * Puerto: de donde sale la credencial de la persona que entra.
 *
 * La sesion solo conoce este contrato; el adaptador de Google se conecta
 * fuera, y en las pruebas se sustituye por uno falso.
 */
export abstract class ProveedorDeIdentidad {
  /** Pinta el acceso en el contenedor y avisa con la credencial cuando llega. */
  abstract preparar(contenedor: HTMLElement, alRecibir: (credencial: string) => void): Promise<void>;
  /** Deja de ofrecer el acceso y olvida la eleccion de cuenta. */
  abstract olvidar(): void;
}
