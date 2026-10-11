import { Cuota, Interes } from './cuota';

/**
 * De donde sale la cuota y a donde va el "avisame". Mismo patron que el resto
 * de puertos: la pantalla depende de esto y la demo funciona sin backend.
 */
export abstract class FuenteDeCuota {
  /** La cuota conocida, sin pedirla otra vez si es reciente. null si no aplica (dueña, exenta, demo). */
  abstract actual(): Promise<Cuota | null>;
  /** Lo mismo pero preguntando ahora, por ejemplo tras generar. Nunca rechaza. */
  abstract refrescar(): Promise<Cuota | null>;
  /** Registra el interes en paquetes o en acceso por academia. Rechaza si el servidor no lo guardo. */
  abstract registrarInteres(interes: Interes): Promise<void>;
}
