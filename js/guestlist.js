const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwgF_bPKcVhcRbNtDYSyPMgwi6J5Fx62vBF6IG13M0EPOFT8Xj6N_XhGBbDOHkXgHX5/exec';

function pollGuests() {
  const status = document.getElementById('syncStatus');
  if (status) status.textContent = '⟳ Synkar…';
  const script = document.createElement('script');
  script.onerror = function() {
    if (status) status.textContent = '✗ Synk misslyckades — kontrollera Apps Script';
    if (script.parentNode) script.parentNode.removeChild(script);
  };
  script.src = SCRIPT_URL + '?callback=handleGuests&t=' + Date.now();
  console.log('[poll] Hämtar:', script.src);
  document.body.appendChild(script);
  setTimeout(() => { if (script.parentNode) script.parentNode.removeChild(script); }, 6000);
}

window.handleGuests = function(data) {
  console.log('[handleGuests] Svar:', JSON.stringify(data));
  const status = document.getElementById('syncStatus');
  const now = new Date();
  const ts = String(now.getHours()).padStart(2,'0') + ':' +
             String(now.getMinutes()).padStart(2,'0') + ':' +
             String(now.getSeconds()).padStart(2,'0');
  if (status) status.textContent = '✓ Senast synkad: ' + ts;

  if (!data || !Array.isArray(data.guests)) {
    console.warn('[handleGuests] Oväntad struktur:', data);
    return;
  }
  const list = document.getElementById('guestList');
  list.innerHTML = '';
  let totalPersons = 0;
  data.guests.forEach(g => {
    if (String(g.attending).toLowerCase() === 'nej') return;
    const entry = document.createElement('div');
    entry.className = 'guest-entry';
    const num = parseInt(g.guests) || 1;
    totalPersons += num;
    const guestCount = num > 1 ? num + ' pers' : '1 pers';
    const karaokeText = String(g.karaoke).toLowerCase() === 'ja'
      ? `<span class="guest-karaoke">🎤 ${g.song ? g.song : 'Sjunger'}</span>`
      : '<span style="color:#ffe000;font-size:10px;">👏 Hejar</span>';
    const travolta = `<svg width="10" height="14" viewBox="0 0 10 14" style="display:inline-block;vertical-align:middle;margin-right:2px;image-rendering:pixelated" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="0" width="4" height="3" fill="#00ff41"/><rect x="3" y="3" width="4" height="4" fill="#00ff41"/><rect x="7" y="2" width="2" height="2" fill="#00ff41"/><rect x="9" y="1" width="1" height="1" fill="#00ff41"/><rect x="1" y="5" width="2" height="2" fill="#00ff41"/><rect x="0" y="7" width="1" height="1" fill="#00ff41"/><rect x="3" y="7" width="2" height="4" fill="#00ff41"/><rect x="5" y="7" width="2" height="4" fill="#00ff41"/><rect x="2" y="11" width="2" height="2" fill="#00ff41"/><rect x="6" y="11" width="2" height="2" fill="#00ff41"/></svg>`;
    const danceText = g.allergies
      ? `<span style="color:#00ff41;font-size:10px;">${travolta}${g.allergies}</span>`
      : '';
    entry.innerHTML = `<span class="guest-name">${g.name}</span><span class="guest-meta">${guestCount}</span>${danceText}${karaokeText}`;
    list.appendChild(entry);
  });
  const count = list.querySelectorAll('.guest-entry').length;
  document.getElementById('guestCountLine').textContent = count + ' anmälda • ' + totalPersons + ' pers';
};

pollGuests();
setInterval(pollGuests, 30000);
