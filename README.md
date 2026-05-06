# Public Applications Live

WeWeb custom component that combines a Germany applications map with a live applications feed.

The component accepts the same application shape as the standalone map/feed components:

```js
{
  created_at: 1777981482767,
  lat: 52.881639,
  lng: 11.486036,
  position_name: 'Servicetechniker (m/w/d)',
  company_name: 'Beispiel GmbH'
}
```

Applications older than the configured live window are visible immediately. Applications inside the live window are replayed one by one with a random delay. Each reveal updates the feed and triggers a synchronized impact animation on the map.

## Local preview

```bash
npm install
npm run build:local
python3 -m http.server 8092
```

Open `http://localhost:8092/assets/preview.html`.
