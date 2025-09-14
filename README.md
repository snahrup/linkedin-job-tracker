# LinkedIn Job Application Tracker

A modern web application to track your LinkedIn job applications by automatically syncing with Gmail and providing insights into your job search progress.

## Features

- 📧 **Gmail Integration**: Automatically sync LinkedIn job application emails
- 📊 **Analytics Dashboard**: Visualize application trends and status distribution
- 🔍 **Smart Filtering**: Filter by status, date range, work location, and employment type
- 📝 **Notes Management**: Add personal notes to each application
- 📈 **Response Metrics**: Track response rates and average response times
- 💾 **Export to CSV**: Export your data for external analysis
- 🎨 **Beautiful UI**: Modern, responsive design with dark mode
- 🔄 **Auto-sync**: Periodic synchronization with Gmail
- 🔔 **Notifications**: Get alerts for application status changes

## Setup

### Prerequisites

- Node.js 18+ and npm
- Google Cloud Project with Gmail API enabled
- OAuth 2.0 Client ID

### Installation

1. Clone the repository:
```bash
cd C:\Users\steve\CascadeProjects\linkedin_job_tracker
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The app will open at http://localhost:3000

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Gmail API:
   - Go to "APIs & Services" → "Library"
   - Search for "Gmail API"
   - Click "Enable"
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Choose "Web application"
   - Add `http://localhost:3000` to "Authorized JavaScript origins"
   - Copy the Client ID
5. In the app, go to Settings and paste your Client ID

## Usage

### Demo Mode
The app starts in demo mode with sample data. This is perfect for exploring features without connecting Gmail.

### Connecting Gmail
1. Click "Settings" in the header
2. Enter your Google OAuth Client ID
3. Save and click "Connect Gmail"
4. Authorize the app to read your Gmail
5. The app will automatically sync your LinkedIn job applications

### Managing Applications
- **View Details**: Each card shows company, position, status, and timeline
- **Add Notes**: Click "Add notes" on any application card
- **Filter**: Use the filter bar to narrow down applications
- **Export**: Click "Export" to download CSV

### Analytics
The analytics section provides:
- 30-day application trend
- Status distribution pie chart
- Response time distribution

## Email Patterns Detected

The app automatically detects and parses:
- Application sent confirmations
- Application viewed notifications
- Interview requests
- Offer letters
- Rejection emails

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development
- **Zustand** for state management
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Recharts** for data visualization
- **Gmail API** for email integration

## Privacy & Security

- All data is stored locally in your browser
- OAuth tokens are stored in session storage
- No data is sent to external servers
- Gmail access is read-only

## Building for Production

```bash
npm run build
```

The build output will be in the `dist` folder.

## Troubleshooting

### Gmail not syncing
- Ensure Gmail API is enabled in your Google Cloud project
- Check that the OAuth Client ID is correct
- Verify authorized origins include your app URL

### No applications showing
- Check date range filters
- Ensure LinkedIn emails aren't in spam/trash
- Try expanding the lookback period in code

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT
