# PRD — Sadaqa Jaryeh (صدقة جارية)

## Problem statement
User uploaded `sadaqaty-main.zip` — a React + TypeScript + Vite Islamic web app. Asked
to complete the missing **Azkar** and **Audio Quran** features.

## Tech stack
- React 19 + TypeScript + Vite 7
- Tailwind CSS 3 (configured but app primarily uses inline styles)
- LocalStorage for all persistence (no backend)
- Public CDNs: everyayah.com (verse-by-verse audio), mp3quran.net (full surahs),
  Nominatim (geocoding)
- Bilingual AR/EN with full RTL support

## User personas
1. **Daily Muslim user** — wants prayer times, Quran reading progress, and daily adhkar
   on phone, works offline-first for cached features.
2. **Multilingual user** — Arabic native or English speaker, switchable from settings.

## Core requirements (static)
- All times computed client-side (no backend)
- Authentic adhkar from canonical sources (Bukhari, Muslim, Abu Dawud, etc.)
- Multiple reciters for audio Quran with verse-by-verse highlighting
- Smart contextual UI (e.g., Home shows morning vs evening adhkar based on time/prayer)

## What's been implemented (Jan 2026)
### Already in original zip (verified working)
- Language picker (EN/AR), Home dashboard, Quran reader (604 pages, juz nav,
  bookmarks, font-size, immersive mode), Prayer Times (5 calc methods, GPS,
  per-prayer offsets, notifications), Settings.

### Newly built in this session
- **AzkarScreen** (`/app/frontend/src/screens/AzkarScreen.tsx`)
  - 9 categories: morning, evening, after_prayer, sleep, waking, duha, travel, food, general
  - 77 total bilingual adhkar with sources, counts, and benefit narrations
  - Tap-to-count gold ring buttons; turn green on completion
  - Counters persisted per-category per-day in localStorage
  - Sidebar category switcher; reset-all and per-zikr reset
  - Live-adjustable font size (+/-)
  - Smart auto-pick of starting category based on current time + nearby prayer
- **AudioQuranScreen** (`/app/frontend/src/screens/AudioQuranScreen.tsx`)
  - 5 reciters: Mishary Alafasy, Husary, Minshawi, Abdul Basit, As-Sudais
  - Verse-by-verse mode (everyayah.com) with synced highlight + auto-scroll
  - Full-surah mode (mp3quran.net)
  - Sticky player bar: play/pause, prev/next, surah picker, auto-continue, progress slider
  - State persists (last surah, last reciter)
- **Audio button enabled** in Home bottom dock (was disabled)
- **App.tsx** routing extended for `azkar` and `audio` screens
- **PWA foundation**: manifest.webmanifest + theme color
- **Migration to /app/frontend**: replaced CRA template with Vite project,
  supervisor runs `yarn start` → vite on port 3000 with `allowedHosts: true`.

## Testing status
- Iteration 1: testing_agent_v3 frontend E2E → **100% pass, zero bugs**
- Audio playback verified live from everyayah.com (Alafasy_128kbps/001001.mp3)
- Counter persistence verified in localStorage
- All 5 reciters + 114 surahs accessible

## Prioritized backlog
### P1 — High impact
- Tafsir / translation toggle in Quran reading screen
- Sharing Ayah / Zikr (Web Share API)
- Tasbeeh standalone counter screen
- Qibla compass screen

### P2 — Medium
- Full PWA service worker for offline audio caching
- Adhan audio (real recorded call to prayer at notification time)
- Hijri calendar with events (Ramadan, Eid, etc.)
- Quran search across all 114 surahs

### P3 — Nice to have
- Dark mode toggle in Settings
- Sadaqa tracker / charity log (matches app name)
- Iftar/Sahoor countdown during Ramadan
- Cloud sync (Firebase) for cross-device progress

## Next tasks list (after user review)
1. Add Tafsir/translation panel to QuranScreen
2. Build Qibla compass with device orientation API
3. Full PWA: register service worker, cache shell + verse audio
4. Hijri events calendar

## File map
- `src/App.tsx` — root router
- `src/screens/HomeScreen.tsx` — dashboard
- `src/screens/QuranScreen.tsx` — Mushaf reader (604 pages)
- `src/screens/PrayerTimesScreen.tsx` — 5 prayers + sunrise
- `src/screens/SettingsScreen.tsx` — location, calc method, language, offsets
- `src/screens/LanguagePicker.tsx` — first-launch lang selection
- `src/screens/AzkarScreen.tsx` — adhkar with counters ⭐ NEW
- `src/screens/AudioQuranScreen.tsx` — audio Quran player ⭐ NEW
- `src/screens/prayerUtils.ts` — astro calc + geocoding + prefs store
- `src/screens/langStore.ts` — language store + EN/AR translation dict
- `src/data/quran.json` — full Quran text (114 surahs)
- `src/data/pageMap.ts` — verse → page mapping (Mushaf 604 pages)
- `src/data/azkar.ts` — bilingual adhkar database ⭐ NEW
- `src/data/reciters.ts` — reciter catalog + URL builders ⭐ NEW

## Notes
- No auth, no backend — fully client-side app
- Original zip had a Cloudflare Wrangler config — removed to run on supervisor
  via plain Vite dev server on port 3000
