# Trackify Frontend

A modern, glassmorphism dashboard for job tracking and analytics.

## Features

- 🎨 **Glassmorphism Design** - Purple/black theme with glass effects
- 📊 **Dashboard** - Stats, charts, and recent activity
- 💼 **Job Management** - Add, track, and update job status
- 📝 **Notes** - Add notes to each job
- 🔌 **API Integration** - Connect to any backend
- 📱 **Responsive** - Works on all devices
- ⚡ **Fast** - Pure vanilla JS, no framework overhead

## Tech Stack

- HTML5
- CSS3 (Glassmorphism, CSS Grid, Flexbox)
- Vanilla JavaScript (ES6+)
- Font Awesome Icons
- Google Fonts (Inter)

## Setup

1. Clone the repository
2. Open `index.html` in your browser
3. Configure API URL in Settings
4. Start tracking!

## Deployment

### Render

1. Push to GitHub
2. Go to [Render.com](https://render.com)
3. Create a new Static Site
4. Connect your repository
5. Publish directory: `./
6. Add environment variable: `NODE_VERSION=18.0.0`

### Manual

Just upload the entire folder to any static hosting service (Netlify, Vercel, etc.)

## API Requirements

The frontend expects your backend to provide these endpoints:

- `GET /health` - Health check
- `GET /jobs` - List all jobs
- `POST /jobs` - Create a job
- `PATCH /jobs/:id/status` - Update job status
- `GET /jobs/:id/notes` - Get job notes
- `POST /jobs/:id/notes` - Add a note
- `GET /matches` - Get job match scores
- `GET /resume/status` - Resume upload status
- `POST /resume/upload` - Upload resume

## License

MIT
