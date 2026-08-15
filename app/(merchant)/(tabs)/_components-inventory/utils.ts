export function shiftWindowToToday(isoString: string): string {
  const original = new Date(isoString);
  const today = new Date();
  today.setHours(original.getHours(), original.getMinutes(), original.getSeconds(), 0);
  return today.toISOString();
}
