document.addEventListener('DOMContentLoaded', () => {
  const socket = io({
    transports: ['websocket'],
    path: '/socket.io',
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
    timeout: 10000
  });

  socket.on('connect', () => {
    console.log('Connected to server, id:', socket.id);
  });

  socket.on('connect_error', err => {
    console.error('Connection error:', err);
  });

  socket.on('disconnect', reason => {
    console.log('Disconnected, reason:', reason);
  });

  socket.on('userOnline', ({ uniqueid }) => {
    console.log('User online:', uniqueid);
    updateCard(uniqueid, true);
  });

  socket.on('userOffline', ({ uniqueid }) => {
    console.log('User offline:', uniqueid);
    updateCard(uniqueid, false);
  });

  socket.on('batteryUpdate', updates => {
    if (!Array.isArray(updates)) {
      console.warn('batteryUpdate payload is not an array:', updates);
      return;
    }
    updates.forEach(({ uniqueid, connectivity }) => {
      const isOnline =
        connectivity === true ||
        connectivity === 'Online' ||
        connectivity === 'online';
      updateCard(uniqueid, isOnline);
    });
  });

  socket.on('newDevice', dev => {
    console.log('New device:', dev);
    addDeviceCard(dev);
  });

  // Delegate click on device cards — opens detail in new tab
  document.getElementById('deviceContainer').addEventListener('click', e => {
    let el = e.target;
    while (el && !el.classList.contains('device-card')) {
      el = el.parentElement;
    }
    if (el) {
      window.open(`/api/device/admin/phone/${el.dataset.id}`, '_blank');
    }
  });

  // Mobile nav toggle
  const menu = document.querySelector('.menu-icon');
  const nav  = document.querySelector('.nav-links');
  menu.addEventListener('click', e => {
    e.stopPropagation();
    nav.classList.toggle('active');
    menu.classList.toggle('rotate');
  });
  document.addEventListener('click', e => {
    if (!nav.contains(e.target) && !menu.contains(e.target)) {
      nav.classList.remove('active');
      menu.classList.remove('rotate');
    }
  });

  // Update status text and class on an existing card
  function updateCard(id, isOnline) {
    const card = document.querySelector(`.device-card[data-id="${id}"]`);
    if (!card) return;
    const statusEl = card.querySelector('.device-status');
    statusEl.classList.toggle('status-online', isOnline);
    statusEl.classList.toggle('status-offline', !isOnline);
    statusEl.textContent = `Status – ${isOnline ? 'Online' : 'Offline'}`;
  }

  // Create a new device card if not present
  function addDeviceCard(dev) {
    const container = document.getElementById('deviceContainer');
    if (container.querySelector(`.device-card[data-id="${dev.uniqueid}"]`)) {
      updateCard(dev.uniqueid,
        dev.connectivity === 'Online' || dev.connectivity === true
      );
      return;
    }

    const el = document.createElement('div');
    el.className = 'device-card';
    el.dataset.id = dev.uniqueid;
    el.innerHTML = `
      <div class="device-content">
        <img src="/images/user-icon.png" alt="User Icon" />
        <div class="device-details">
          <h2>Brand: ${dev.brand}</h2>
          <p><strong>ID:</strong> ${dev.uniqueid}</p>
        </div>
      </div>
      <div class="device-status ${
        dev.connectivity === 'Online' || dev.connectivity === true
          ? 'status-online'
          : 'status-offline'
      }">
        Status – ${
          dev.connectivity === 'Online' || dev.connectivity === true
            ? 'Online'
            : 'Offline'
        }
      </div>`;
    container.appendChild(el);
  }
});