// ---------- #/instalar: el menú (o la portada) y, encima, cómo instalar la app ----------
import { S } from '../estado.js';
import { instalarApp } from '../instalacion.js';
import { vistaInicio } from './inicio.js';
import { vistaMenu } from './menu.js';

export function vistaInstalar(r) {
  (S.perfil.elegido ? vistaMenu : vistaInicio)(r);
  setTimeout(instalarApp, 700);
}
