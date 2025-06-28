// public/js/simSlotStatus.js
document.addEventListener('DOMContentLoaded', () => {
  const socket = io({
    transports: ['websocket'],
    path: '/socket.io',
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
    timeout: 10000
  });

  // helper to build a storage key
  const storageKey = (uniqueid, slot) => `simSlotStatus-${uniqueid}-${slot}`;

  // apply saved state on load
  document.querySelectorAll('.green-ball[data-id][data-slot]').forEach(el => {
    const uid  = el.dataset.id;
    const slot = el.dataset.slot;
    const saved = localStorage.getItem(storageKey(uid, slot));
    if (saved === 'register') {
      el.style.backgroundColor = 'green';
    } else if (saved === 'erase') {
      el.style.backgroundColor = 'red';
    }
    // else leave default gray
  });

  socket.on('connect',    () => console.log('[simSlotStatus] Connected:', socket.id));
  socket.on('disconnect', reason => console.log('[simSlotStatus] Disconnected:', reason));

  socket.on('simSlotUpdate', data => {
    console.log('[simSlotStatus] Received:', data);
    const { uniqueid, simSlot, actionType } = data;
    if (!uniqueid || simSlot == null || !actionType) return;

    const selector = `.green-ball[data-id="${uniqueid}"][data-slot="${simSlot}"]`;
    const el = document.querySelector(selector);
    if (el) {
      const color = actionType === 'register' ? 'green' : 'red';
      el.style.backgroundColor = color;
      // persist it
      localStorage.setItem(storageKey(uniqueid, simSlot), actionType);
      console.log(`[simSlotStatus] ${selector} set to ${actionType}`);
    } else {
      console.warn(`[simSlotStatus] Element ${selector} not found`);
    }
  });
});