# Next English App (SM-2 Enhanced)

This project is an open-source Next.js app for English learning. It includes:
- 百词斩 (word-blitz) with TTS and image support
- 连词造句 with keyboard shortcuts and progress bar
- SM-2 SRS scheduling
- Course import script for JSON course files

## Run locally
```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npx tsx prisma/seed.ts
npm run dev
```
Open http://localhost:3000

## Contributing
See CONTRIBUTING.md. The project uses MIT license.
