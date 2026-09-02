'use strict';

// Локальний перегляд. Сайт треба саме віддавати по HTTP, а не відкривати
// файлом: перемикач мов веде на теку (`uk/`), і через file:// браузер показує
// перелік каталогу замість сторінки. Залежностей тут немає — як і в build.js.

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { build, LANGS, DEFAULT_LANG } = require('./build.js');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'dist');

const args = process.argv.slice(2);
function flag(name) {
  return args.includes(`--${name}`);
}
function option(name, fallback) {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
}

const PORT = Number(option('port', process.env.PORT || 8000));
const WATCH = !flag('no-watch');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

// Збірка зносить dist цілком і збирає наново. Поки вона триває, віддавати
// нема чого, тож запити чекають на неї, а не ловлять 404 на півдорозі.
let building = null;

function rebuild(reason) {
  building = (async () => {
    const started = Date.now();
    try {
      build({ root: ROOT, outDir: OUT });
      console.log(`${reason}: зібрано за ${Date.now() - started} мс`);
    } catch (err) {
      // Розбіжність словників не має вбивати сервер: попередній dist уже
      // знесено, але виправлення файла зараз же запустить збірку знову.
      console.error(`${reason}: ${err.message}`);
    }
  })();
  return building;
}

// Не даємо вийти за межі dist: шлях із запиту нормалізуємо і перевіряємо, що
// він і далі всередині теки.
function resolveFile(urlPath) {
  let rel = decodeURIComponent(urlPath.split('?')[0]);
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.join(OUT, rel);
  if (file !== OUT && !file.startsWith(OUT + path.sep)) return null;
  return file;
}

const server = http.createServer(async (req, res) => {
  if (building) await building;

  const file = resolveFile(req.url);
  if (!file) {
    res.writeHead(403).end('за межами dist');
    return;
  }

  fs.readFile(file, (err, body) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': TYPES['.txt'] });
      res.end(`немає ${req.url}`);
      return;
    }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(body);
  });
});

// Джерела сторінки. style.css і waitlist.js копіюються у dist як є, тож їх
// теж треба перезбирати — інакше правка не доїде до браузера.
const WATCHED_DIRS = ['src', 'i18n'];
const WATCHED_FILES = ['style.css', 'waitlist.js'];

function watch() {
  let timer = null;
  // Редактори пишуть файл кількома подіями поспіль; збираємо один раз.
  const schedule = (what) => {
    clearTimeout(timer);
    timer = setTimeout(() => rebuild(`змінився ${what}`), 80);
  };

  for (const dir of WATCHED_DIRS) {
    fs.watch(path.join(ROOT, dir), { recursive: true }, (_event, name) => {
      schedule(name ? path.join(dir, name) : dir);
    });
  }

  // Два файли в корені стежимо через саму теку і за іменем. fs.watch на
  // окремому файлі у Windows однаково слухає теку, що його містить, — а в
  // корені лежить dist. Збірка пише в dist, це будить стеження, і воно
  // запускає збірку знову: нескінченне коло.
  fs.watch(ROOT, { recursive: false }, (_event, name) => {
    if (WATCHED_FILES.includes(name)) schedule(name);
  });
}

rebuild('старт').then(() => {
  server.listen(PORT, () => {
    console.log('');
    for (const lang of LANGS) {
      const at = lang === DEFAULT_LANG ? '' : `${lang}/`;
      console.log(`  ${lang}  http://localhost:${PORT}/${at}`);
    }
    console.log('');
    console.log(WATCH ? '  правки збираються самі · Ctrl+C щоб спинити' : '  Ctrl+C щоб спинити');
  });
  if (WATCH) watch();
});
