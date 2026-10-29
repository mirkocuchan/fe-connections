export function formatTime(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function sameDay(a?: string, b?: string) {
  if (!a || !b) return false;
  return startOfDay(new Date(a)) === startOfDay(new Date(b));
}

export function dayLabel(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86400000);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Ayer";
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}