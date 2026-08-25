// Форма чекає на endpoint. Поки його немає, вона про це чесно каже —
// мовчазний «Thanks!» без жодного запиту був би брехнею відвідувачу.
//
// Щоб підключити: постав URL у data-endpoint у src/index.html. Більше нічого.
//
// Тексти живуть у data-msg-* поруч із data-endpoint, а не тут: так усі
// рядки сторінки лишаються в одному місці — i18n/<lang>.json — і скрипт
// не знає, якою мовою його відкрили.
document.querySelectorAll('.waitlist').forEach((form) => {
  const note = form.querySelector('.form-note');
  const input = form.querySelector('input[type="email"]');
  const button = form.querySelector('button');
  const msg = form.dataset;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!input.value.trim() || !input.checkValidity()) {
      note.textContent = msg.msgInvalid;
      return;
    }

    const endpoint = msg.endpoint;

    if (!endpoint) {
      note.textContent = msg.msgUnwired;
      return;
    }

    button.disabled = true;
    note.textContent = msg.msgSending;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      });

      if (!response.ok) throw new Error(String(response.status));

      form.reset();
      note.textContent = msg.msgOk;
    } catch {
      note.textContent = msg.msgFail;
    } finally {
      button.disabled = false;
    }
  });
});
