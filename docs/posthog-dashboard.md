# Дашборд PostHog «Landing»

Що зібрати в проєкті PostHog (EU, той самий, що й застосунок) для сайту.
Усі події сайту несуть `site = landing`, тож кожен графік фільтрується саме
так — щоб не змішуватися з подіями застосунку.

Події й властивості — README, розділ «Analytics».

## Графіки

| # | Назва | Тип | Що саме |
|---|---|---|---|
| 1 | Візити за днями | Trends | `$pageview`, total count, щодня; breakdown `lang`. Фільтр `site = landing`, `page = home`. |
| 2 | Джерела | Trends (table) | `$pageview`, breakdown `$referring_domain`; другий графік — breakdown `utm_source`. Останні 30 днів. |
| 3 | Конверсія в App Store | Funnel | `$pageview` (page = home) → `store_click`. Breakdown `utm_source`, далі `$referring_domain`. Вікно — 30 хв. |
| 4 | До якого блоку догортають | Trends (bar) | `section_viewed`, total count, breakdown `section`, сортувати за `order`. Поруч — те саме як % від `$pageview` (formula `B / A`). |
| 5 | Яка кнопка працює | Trends (pie) | `store_click`, breakdown `place` (`hero` / `finale`). |
| 6 | Кампанії | Trends (table) | `store_click`, breakdown `campaign` — ті самі мітки `ct`, що й в App Store Connect. |
| 7 | Мови | Trends | `language_switched`, breakdown `to`; поруч `$pageview` breakdown `lang`. |
| 8 | Час на сторінці | Trends | `$pageleave`, property `$prev_pageview_duration`, median, щодня. |
| 9 | Сайт → застосунок | Trends | серія A: `store_click` (`site = landing`), серія B: `app_first_open` (без фільтра `site`), щодня. Грубе співвідношення кліків і перших запусків. |
| 10 | Політика | Trends | `$pageview` з `page = privacy`, щодня. |

## Як читати

- **4** — головний для рішень про контент: різке падіння між сусідніми
  блоками означає, що на попередньому блоці кидають читати.
- **3** з розбивкою за джерелом показує, яке джерело приводить людей, що
  справді натискають App Store, а не просто відкривають сторінку.
- **6** звіряється з App Store Connect → App Analytics → Sources →
  Campaigns: там ті самі мітки, але вже з кількістю завантажень (коли в
  `build.js` заповнено `APP_STORE_PROVIDER_TOKEN`).
- `persistence: 'memory'` робить кожне відкриття новим анонімним
  відвідувачем, тож «унікальні користувачі» тут дорівнюють візитам. Дивитися
  варто на total count, а не на unique users.
