function submitRSVP() {
  const name = document.getElementById('name').value.trim();
  if (!name) { alert('Ange ditt namn!'); return; }
  const attending = document.querySelector('input[name="attending"]:checked').value;
  const karaokeEl = document.querySelector('input[name="karaoke"]:checked');
  const karaoke = karaokeEl ? karaokeEl.value : 'nej';
  const guests = document.getElementById('guests').value;
  const allergies = document.getElementById('allergies').value.trim();
  const song = document.getElementById('song').value.trim();
  const email = document.getElementById('email').value.trim();
  const message = document.getElementById('message') ? document.getElementById('message').value.trim() : '';

  const btn = document.querySelector('#rsvpForm .win95-submit');
  if (btn) { btn.textContent = 'Skickar…'; btn.disabled = true; }

  const params = new URLSearchParams({ name, email, attending, karaoke, guests, allergies, song, message });

  fetch(SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    body: params
  })
  .then(() => {
    document.getElementById('successDialog').classList.add('active');
    setTimeout(pollGuests, 2000);
  })
  .catch(() => {
    alert('Något gick fel vid skickning. Försök igen!');
    if (btn) { btn.textContent = 'OK — Skicka anmälan ↵'; btn.disabled = false; }
  });
}

function closeDialog() {
  document.getElementById('successDialog').classList.remove('active');
  const form = document.getElementById('rsvpForm');
  form.style.opacity = '1';
  form.style.pointerEvents = 'auto';
  form.querySelector('#name').value = '';
  form.querySelector('#email').value = '';
  form.querySelector('#allergies').value = '';
  form.querySelector('#song').value = '';
  if (form.querySelector('#message')) form.querySelector('#message').value = '';
  form.querySelector('#guests').selectedIndex = 0;
  const jaRadio = form.querySelector('input[name="attending"][value="ja"]');
  if (jaRadio) jaRadio.checked = true;
  const nejKaraoke = form.querySelector('input[name="karaoke"][value="nej"]');
  if (nejKaraoke) nejKaraoke.checked = true;
  const btn = form.querySelector('.win95-submit');
  if (btn) { btn.textContent = 'OK — Skicka anmälan ↵'; btn.disabled = false; }
}
