// Куди йде пошта: у PostHog (analytics.js) і, якщо в data-endpoint стоїть
// URL, ще й туди. Без жодного з двох форма чесно каже, що не підключена, —
// мовчазний «Thanks!» без запиту був би брехнею відвідувачу.
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

    const email = input.value.trim();
    const endpoint = msg.endpoint;
    const analytics = window.analyticsReady;

    if (!endpoint && !analytics) {
      note.textContent = msg.msgUnwired;
      return;
    }

    button.disabled = true;
    note.textContent = msg.msgSending;

    try {
      if (analytics) {
        // Проміс каже, чи array.js доїхав. Не доїхав — це відмова, а не
        // привід показати подяку.
        if (!(await analytics)) throw new Error();

        // Людину впізнають за поштою: два записи з тієї самої адреси
        // зіллються в один профіль, а не подвояться у списку.
        window.posthog.identify(email, {
          email,
          lang: document.documentElement.lang,
        });

        window.posthog.capture('waitlist_signup', {
          email,
          lang: document.documentElement.lang,
          place: msg.place,
        });
      }

      if (endpoint) {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: new FormData(form),
        });

        if (!response.ok) throw new Error(String(response.status));
      }

      form.reset();
      note.textContent = msg.msgOk;
    } catch {
      note.textContent = msg.msgFail;
    } finally {
      button.disabled = false;
    }
  });
});
