// Форма чекає на endpoint. Поки його немає, вона про це чесно каже —
// мовчазний «Thanks!» без жодного запиту був би брехнею відвідувачу.
//
// Щоб підключити: постав URL у data-endpoint у index.html. Більше нічого.
document.querySelectorAll('.waitlist').forEach((form) => {
  const note = form.querySelector('.form-note');
  const input = form.querySelector('input[type="email"]');
  const button = form.querySelector('button');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!input.value.trim() || !input.checkValidity()) {
      note.textContent = 'That does not look like an email address.';
      return;
    }

    const endpoint = form.dataset.endpoint;

    if (!endpoint) {
      note.textContent =
        'The waitlist is not connected yet, so nothing was sent. Check back shortly.';
      return;
    }

    button.disabled = true;
    note.textContent = 'Sending…';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      });

      if (!response.ok) throw new Error(String(response.status));

      form.reset();
      note.textContent = 'You are on the list. No other mail, ever.';
    } catch {
      note.textContent = 'That did not go through. Try again in a moment.';
    } finally {
      button.disabled = false;
    }
  });
});
