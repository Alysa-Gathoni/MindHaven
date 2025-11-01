# MindHaven Admin Panel

React-based admin panel for managing the MindHaven wellbeing platform.

## Features

- 🔐 Firebase Authentication for admins
- 📊 Real-time analytics dashboard
- 👥 User management and monitoring
- 🚩 Flagged content review system
- 📈 System health monitoring
- 🎨 Modern, responsive UI

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query
- **Charts**: Recharts
- **Tables**: TanStack Table
- **Forms**: React Hook Form + Zod
- **Authentication**: Firebase Auth

## Quick Start

### Prerequisites

- Node.js 18+
- Firebase project with Admin SDK
- Backend API running

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Configure your .env file
```

### Environment Variables

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:4000/api

# Firebase Configuration
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── ui/             # Base UI components
│   ├── charts/         # Chart components
│   ├── forms/          # Form components
│   └── layout/         # Layout components
├── pages/              # Page components
│   ├── DashboardPage.tsx
│   ├── UsersPage.tsx
│   ├── FlaggedEntriesPage.tsx
│   ├── AnalyticsPage.tsx
│   └── SettingsPage.tsx
├── hooks/              # Custom hooks
├── services/           # API services
├── types/              # TypeScript types
├── utils/              # Utility functions
└── test/               # Test files
```

## Key Features

### Dashboard

- System overview metrics
- Recent activity feed
- Quick actions
- System health status

### User Management

- User list with search/filter
- User details and activity
- Role management
- Account actions

### Flagged Content Review

- Crisis language detection
- Content moderation tools
- Review workflow
- Action tracking

### Analytics

- Mood trends over time
- User engagement metrics
- Sentiment analysis
- Export capabilities

## Authentication

The admin panel uses Firebase Authentication with role-based access:

1. Admin users must be created in the backend
2. Firebase custom claims for admin role
3. Protected routes with role verification
4. Automatic token refresh

## API Integration

Uses TanStack Query for API state management:

```typescript
// Example API hook
const { data: users, isLoading } = useQuery({
  queryKey: ["users"],
  queryFn: () => api.getUsers(),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

## Styling

Uses Tailwind CSS with custom design system:

- Consistent color palette
- Responsive design
- Dark mode support
- Accessibility features

## Testing

```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm test -- --watch
```

## Building for Production

```bash
# Build the application
npm run build

# The build output will be in the `dist` directory
```

## Docker Deployment

```bash
# Build Docker image
docker build -t mindhaven-admin .

# Run container
docker run -p 3000:80 mindhaven-admin
```

## Environment Configuration

### Development

- Uses Vite dev server
- Hot module replacement
- Source maps enabled

### Production

- Optimized build
- Code splitting
- Asset optimization
- Nginx serving

## Security Considerations

- Admin-only access
- Firebase token verification
- CORS configuration
- Content Security Policy
- Input sanitization

## Performance

- Code splitting by route
- Lazy loading of components
- Image optimization
- Bundle analysis
- Caching strategies

## Monitoring

- Error tracking
- Performance monitoring
- User analytics
- System health checks

## Troubleshooting

### Common Issues

1. **Firebase setup**: Ensure admin SDK is configured
2. **API connection**: Check backend API is running
3. **Build errors**: Clear node_modules and reinstall
4. **Authentication**: Verify admin role in database

### Debug Mode

```bash
# Enable debug logging
VITE_DEBUG=true npm run dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.



