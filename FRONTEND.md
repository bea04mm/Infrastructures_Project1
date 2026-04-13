# Frontend Documentation

## Overview

The frontend is a modern React application with Vite for fast development and building. It provides a user interface for:
- Event management (create, read, update, delete)
- Guest registration and tracking
- Real-time event scheduling
- Multi-language support (8 languages)
- Responsive design for desktop and mobile

## Tech Stack

- **React 18** - UI framework
- **Vite 5** - Build tool and dev server
- **Rollup** - Module bundler
- **CSS3** - Styling
- **Fetch API** - HTTP requests (no external library)
- **i18n** - Internationalization with date-fns locales

## Project Structure

```
frontend/
├── public/           # Static assets
├── src/
│   ├── components/   # Reusable React components
│   │   ├── AppHeader.jsx      # Navigation header
│   │   ├── AppFooter.jsx      # Footer
│   │   ├── EventModal.jsx     # Event create/edit modal
│   │   ├── ConfirmModal.jsx   # Confirmation dialog
│   │   └── ...
│   ├── pages/        # Full page components (routes)
│   │   ├── App.jsx          # Main calendar view
│   │   ├── LoginPage.jsx    # Login form
│   │   ├── RegisterPage.jsx # Registration form
│   │   ├── EventKioskPage.jsx # Kiosk display
│   │   └── ...
│   ├── main.jsx      # React entry point
│   ├── auth.js       # Authentication utilities
│   └── index.js      # Main application component
├── app/              # Scheduler and calendar components
│   ├── Scheduler.jsx          # Calendar view component
│   ├── DayModeView.jsx        # Day view
│   ├── WeekModeView.jsx       # Week view
│   ├── MonthModeView.jsx      # Month view
│   ├── TimeLineModeView.jsx   # Timeline view
│   ├── Toolbar.jsx            # Calendar toolbar
│   ├── ToolbarSeachBar.jsx   # Search functionality
│   ├── EventItem.jsx          # Single event display
│   └── styles.css             # Calendar styles
├── locales/          # Internationalization
│   ├── locale.js             # Language configuration
│   ├── dateFnsContext.js     # Date locale context
│   └── [lang]/common.json    # Translation files
├── package.json      # Dependencies
├── vite.config.js    # Vite configuration
├── rollup.config.js  # Rollup configuration
├── Dockerfile        # Container configuration
└── README.md         # Frontend-specific docs
```

## Getting Started

### Development

```bash
# Start development server
cd frontend
npm install
npm run dev

# Access at http://localhost:5173
```

### Build for Production

```bash
cd frontend
npm run build

# Output in dist/
# Compress for deployment
cd dist
tar -czf ../frontend.tar.gz .
```

## Configuration

### Environment Variables

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
VITE_JWT_EXPIRATION=24
VITE_DEFAULT_LANGUAGE=en
```

### Vite Config

`vite.config.js`:
```javascript
export default {
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    minify: 'terser'
  }
}
```

## Key Components

### Authentication Module (`auth.js`)

Handles JWT token management:

```javascript
// Store token
localStorage.setItem('accessToken', token);

// Get token
const token = localStorage.getItem('accessToken');

// Make authenticated request
fetch('/events', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

### API Communication

No external HTTP library - uses Fetch API:

```javascript
// GET request
const events = await fetch('http://localhost:8000/events', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());

// POST request
const event = await fetch('http://localhost:8000/events', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'New Event',
    start_date: '2026-04-13 09:00:00',
    end_date: '2026-04-13 17:00:00'
  })
}).then(r => r.json());

// DELETE request
await fetch(`http://localhost:8000/events/${id}`, {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Event Calendar (`Scheduler.jsx`)

The main calendar component:

```javascript
import Scheduler from '../app/Scheduler';

<Scheduler
  events={events}
  onEventCreate={handleCreate}
  onEventUpdate={handleUpdate}
  onEventDelete={handleDelete}
  initialMode="month"
/>
```

Props:
- `events` - Array of event objects
- `onEventCreate` - Callback for new events
- `onEventUpdate` - Callback for event edits
- `onEventDelete` - Callback for deletion
- `initialMode` - Display mode: "day", "week", "month", "timeline"

### Modal Components

#### EventModal

```javascript
<EventModal
  isOpen={showModal}
  event={selectedEvent}
  onClose={handleCloseModal}
  onSave={handleSaveEvent}
/>
```

#### ConfirmModal

```javascript
<ConfirmModal
  isOpen={showConfirm}
  title="Delete Event?"
  message="This action cannot be undone"
  onConfirm={handleDelete}
  onCancel={handleCancel}
/>
```

## Styling

### CSS Structure

- `app/styles.css` - Calendar and UI styles
- Component-level styles inline or co-located
- Responsive design with media queries

### Theme Variables

Define in CSS:

```css
:root {
  --primary-color: #007bff;
  --secondary-color: #6c757d;
  --success-color: #28a745;
  --danger-color: #dc3545;
  --warning-color: #ffc107;
}
```

## Internationalization (i18n)

### Supported Languages

- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Arabic (ar)
- Japanese (ja)
- Korean (ko)
- Chinese (zh)

### Usage

```javascript
import { useTranslation } from 'react-i18next';

export default function MyComponent() {
  const { t, i18n } = useTranslation();
  
  return (
    <div>
      <h1>{t('events.title')}</h1>
      <button onClick={() => i18n.changeLanguage('es')}>
        Español
      </button>
    </div>
  );
}
```

### Add New Translation

1. Add key to all language files in `locales/[lang]/common.json`:

```json
{
  "events": {
    "title": "My Events",
    "create": "Create Event"
  }
}
```

2. Use in component:

```javascript
t('events.title')    // "My Events"
t('events.create')   // "Create Event"
```

### Date Internationalization

Date-fns locales are configured per language:

```javascript
import { enUS, es, de, fr, ... } from 'date-fns/locale';

const localeMap = {
  'en': enUS,
  'es': es,
  'de': de,
  // ...
};
```

## State Management

Uses React hooks and Context API (no external state library):

```javascript
// Local component state
const [events, setEvents] = useState([]);
const [selectedEvent, setSelectedEvent] = useState(null);

// Effect for side effects
useEffect(() => {
  fetchEvents().then(setEvents);
}, []);

// Context for global state
const { user, setUser } = useContext(AuthContext);
```

## Routing

React Router for page navigation (if implemented):

```javascript
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

<Router>
  <Routes>
    <Route path="/" element={<App />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/kiosk" element={<EventKioskPage />} />
  </Routes>
</Router>
```

## Pages Overview

### LoginPage.jsx

User authentication:
- Email and password fields
- Login button
- Link to register
- Error messages
- Redirect on success

### RegisterPage.jsx

New user registration:
- Email, password, full name fields
- Password confirmation
- Terms acceptance checkbox
- Submit button
- Redirect to login

### App.jsx

Main application page:
- Calendar view (Scheduler component)
- Event list sidebar
- Create event button
- Event details panel
- Guest management

### EventKioskPage.jsx

Public kiosk display:
- Event information
- Guest check-in form
- Real-time updates
- No authentication required
- Mobile-friendly layout

## Performance Optimization

### Code Splitting

```javascript
import { lazy, Suspense } from 'react';

const LoginPage = lazy(() => import('./pages/LoginPage'));

<Suspense fallback={<Loading />}>
  <LoginPage />
</Suspense>
```

### Memoization

```javascript
import { memo } from 'react';

const EventItem = memo(({ event, onSelect }) => (
  <div onClick={() => onSelect(event)}>
    {event.name}
  </div>
));
```

### useCallback

```javascript
const handleDelete = useCallback((eventId) => {
  deleteEvent(eventId);
}, []);
```

## Testing

### Unit Tests (if added)

```bash
npm run test
```

### Example Test

```javascript
import { render, screen } from '@testing-library/react';
import EventItem from './EventItem';

test('renders event name', () => {
  const event = { id: 1, name: 'Test Event' };
  render(<EventItem event={event} />);
  expect(screen.getByText('Test Event')).toBeInTheDocument();
});
```

### E2E Tests

```bash
npm run test:e2e
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Security

### XSS Prevention

React escapes values by default:

```javascript
{/* Text content automatically escaped */}
<div>{userInput}</div>

{/* Use dangerouslySetInnerHTML only for trusted content */}
<div dangerouslySetInnerHTML={{ __html: trustedHTML }} />
```

### CSRF Protection

Token included in Authorization header (not cookie):

```javascript
fetch('/api/events', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
```

### Environment Variables

Sensitive data in `.env`, not in code:

```javascript
// ✓ Good
const API_URL = import.meta.env.VITE_API_URL;

// ✗ Bad
const API_URL = 'http://secret-server.internal:8000';
```

## Debugging

### Browser DevTools

```javascript
// Log component renders
console.log('EventItem rendered', event);

// React DevTools extension
// Inspect component hierarchy
// Monitor state and props

// Network tab
// Check API requests
// Inspect request/response

// Application tab
// Check localStorage tokens
// View cookies
```

### Common Issues

**API calls fail:**
- Check browser Network tab
- Verify VITE_API_URL in .env
- Check CORS headers in backend
- Verify authentication token

**Component not updating:**
- Check state updates with setState
- Verify useEffect dependencies
- Check prop changes with React DevTools

**Styling issues:**
- Check CSS file is imported
- Verify class names match CSS
- Check media queries for mobile
- Use browser DevTools Inspector

## Build & Deployment

### Production Build

```bash
npm run build

# Output in frontend/dist/
# Files: index.html, app-xxx.js, styles-xxx.css
```

### Deployment Options

**Option 1: Static File Server**
```bash
# Copy dist/ to web server
# Configure server to serve index.html for SPA routing
```

**Option 2: Docker (as in this project)**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "run", "dev"]
```

**Option 3: CDN**
```bash
# Upload dist/ files to CDN (CloudFlare, Netlify, Vercel)
# Update VITE_API_URL to production API
# Deploy: git push
```

## Maintenance

### Update Dependencies

```bash
npm outdated                    # Check for updates
npm update                      # Update all packages
npm install [package@latest]    # Update specific package
npm audit                       # Check for vulnerabilities
npm audit fix                   # Auto-fix vulnerabilities
```

### Version Releases

```bash
# Semantic versioning: MAJOR.MINOR.PATCH
npm version patch    # 1.0.0 → 1.0.1
npm version minor    # 1.0.1 → 1.1.0
npm version major    # 1.1.0 → 2.0.0
```

## Architecture Diagram

```
┌─────────────────────────────────────┐
│        Frontend (React/Vite)        │
├─────────────────────────────────────┤
│                                     │
│  Pages:                             │
│  ├─ LoginPage                       │
│  ├─ RegisterPage                    │
│  ├─ App (Calendar)                  │
│  └─ EventKioskPage                  │
│                                     │
│  Components:                        │
│  ├─ Scheduler (Calendar Engine)     │
│  ├─ EventModal                      │
│  ├─ ConfirmModal                    │
│  ├─ AppHeader/Footer                │
│  └─ ...                             │
│                                     │
│  Services:                          │
│  ├─ auth.js (JWT)                   │
│  ├─ API calls (Fetch)               │
│  └─ i18n (Translations)             │
│                                     │
└──────────────┬──────────────────────┘
               │ HTTP/REST
               ↓
┌─────────────────────────────────────┐
│       Backend API (FastAPI)         │
│       Port: 8000                    │
└─────────────────────────────────────┘
```

## Useful npm Commands

```bash
npm run dev              # Start dev server
npm run build            # Production build
npm run preview          # Preview production build
npm run lint             # Lint code (if configured)
npm run test             # Run tests (if configured)
npm run format           # Format code (if configured)
npm run analyze          # Bundle analysis (if configured)
npm install <package>    # Add dependency
npm uninstall <package>  # Remove dependency
npm list                 # List installed packages
npm cache clean --force  # Clear npm cache
```

## Git Best Practices

```bash
# Create feature branch
git checkout -b feature/calendar-improvements

# Make changes
git add .
git commit -m "feat: add week view calendar"

# Push and create pull request
git push origin feature/calendar-improvements

# After review, merge to main
git checkout main
git merge feature/calendar-improvements
git push origin main
```

## Resources & Links

- [React Documentation](https://react.dev)
- [Vite Guide](https://vitejs.dev)
- [date-fns Docs](https://date-fns.org)
- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [React Hooks](https://react.dev/reference/react)
- [CSS Guide](https://developer.mozilla.org/en-US/docs/Web/CSS)
