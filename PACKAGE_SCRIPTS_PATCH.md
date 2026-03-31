# Suggested package.json updates

## backend/package.json
```json
{
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "test": "node --test",
    "seed:demo": "node scripts/seed-demo.js"
  }
}
```

## frontend/package.json
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```
