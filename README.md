# Puls Basketu - Broadcast System

System do zarządzania grafikami transmisyjnymi dla meczów koszykówki.

## Wymagania

- Node.js 18+
- npm lub yarn

## Instalacja

```bash
npm install
```

## Konfiguracja

Utwórz plik `.env` w głównym katalogu projektu:

```env
# Backend API URL
NUXT_PUBLIC_API_BASE=http://localhost:8000

# WebSocket URL
NUXT_PUBLIC_WEBSOCKET_BASE=ws://localhost:8001
```

### Przykładowa konfiguracja produkcyjna:

```env
NUXT_PUBLIC_API_BASE=https://api.pulsbasketu.com
NUXT_PUBLIC_WEBSOCKET_BASE=wss://ws.pulsbasketu.com
```

## Uruchomienie

### Tryb deweloperski

```bash
npm run dev
```

Aplikacja będzie dostępna pod adresem: `http://localhost:3000`

### Build produkcyjny

```bash
npm run build
npm run preview
```

## Struktura projektu

- `app/` - główna aplikacja Nuxt
  - `components/` - komponenty Vue
  - `composables/` - composables Vue (useAuth, useApi, useWebSocket)
  - `constants/` - stałe (ligi)
  - `pages/` - strony aplikacji
  - `public/` - pliki statyczne
- `INFOGRAPHIC_GUIDE.md` - przewodnik tworzenia nowych infografik

## Użytkowanie

### Role użytkowników

1. **BROADCAST** - operator transmisji
   - Panel kontrolny do zarządzania grafikami
   - Podgląd na żywo
   - Kontrola nad wyświetlanymi infografikami

2. **SUPER_ADMIN** - administrator
   - Zarządzanie kanałami transmisyjnymi
   - Generowanie kluczy broadcast

### Dostępne grafiki

- **Mapa rzutów drużyny** - wizualizacja wszystkich rzutów zespołu
- **Mapa rzutów zawodnika** - wizualizacja rzutów pojedynczego gracza

### Panel kontrolny

1. Zaloguj się przy użyciu danych użytkownika BROADCAST
2. Wprowadź klucz transmisji (Broadcast Key)
3. Wybierz ligę i mecz
4. Wybierz typ grafiki
5. Skonfiguruj parametry (drużyna/zawodnik)
6. Kliknij "POKAŻ" aby wyświetlić grafikę
7. Kliknij "UKRYJ" aby ukryć grafikę

### Stage URL (dla OBS)

URL do dodania jako "Browser Source" w OBS:
```
http://localhost:3000/stage/{channel_id}?key={broadcast_key}
```

Wymiary: 1920x1080

## Dodawanie nowych infografik

Zobacz `INFOGRAPHIC_GUIDE.md` dla szczegółowego przewodnika.

## Technologie

- Nuxt 4
- Vue 3
- Tailwind CSS
- Three.js (wizualizacje 3D)
- WebSocket (komunikacja real-time)
