/**
 * La cuenta de quien ha entrado. Mismo patron que RepositorioDePerfil: la
 * aplicacion depende del puerto y la demo funciona sin backend.
 */
export abstract class RepositorioDeCuenta {
  /** Borra perfil, CV cifrado y consentimientos. Rechaza si el servidor no lo hizo. */
  abstract borrar(): Promise<void>;
}
