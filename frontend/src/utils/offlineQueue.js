const QUEUE_KEY = 'sahayta_offline_sos_queue';

export function readQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeQueue(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function enqueueSos(payload) {
  const queue = readQueue();
  const entry = { id: `local-${Date.now()}`, payload, savedAt: new Date().toISOString() };
  queue.push(entry);
  writeQueue(queue);
  return entry;
}

export function removeFromQueue(id) {
  writeQueue(readQueue().filter((e) => e.id !== id));
}

export function queueLength() {
  return readQueue().length;
}
