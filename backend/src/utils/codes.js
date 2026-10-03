export function generateSosCode() {
  const n = Math.floor(10000 + Math.random() * 90000);
  return `SH-SOS-${n}`;
}
