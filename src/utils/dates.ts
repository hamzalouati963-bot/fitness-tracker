/**
 * Utilitaires de dates "jour utilisateur" (fuseau LOCAL).
 *
 * Regle du projet :
 *  - Timestamps absolus (created_at, updated_at, exported_at) : UTC ISO (new Date().toISOString()).
 *  - Toute date representant une JOURNEE utilisateur (nutrition, hydratation, workouts,
 *    daily_logs, measurements, "today") : heure locale, via les fonctions ci-dessous.
 *
 * `new Date().toISOString().split('T')[0]` ne doit JAMAIS servir pour une date journaliere :
 * en UTC+1, a 00h30 locale il retourne encore la veille.
 */

/** Formate une Date en date locale YYYY-MM-DD (jour civil de l'utilisateur). */
export function formatDateLocal(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Aujourd'hui (heure locale) au format YYYY-MM-DD. */
export function todayLocal(): string {
  return formatDateLocal(new Date());
}

/** Date locale d'il y a `days` jours, au format YYYY-MM-DD. */
export function dateDaysAgoLocal(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return formatDateLocal(d);
}