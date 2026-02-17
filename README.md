# 🏥 MediTrack - Real-Time Hospital Resource Dashboard

A production-ready, real-time bed and blood availability system for government hospitals, built for emergency response and resource management.

## 🚀 Live Demo

**[View Live Application →](https://meditrack-deepesh-m1oz95g6l-deepeshyadav2504006-4769s-projects.vercel.app/)**

- **Frontend**: https://meditrack-deepesh-m1oz95g6l-deepeshyadav2504006-4769s-projects.vercel.app/
- **Backend API**: https://meditrack-backend-daxo.onrender.com

## 🎯 Features

### Public Dashboard
- **Real-time Updates**: Live bed and blood availability via Socket.io
- **City Filtering**: Filter hospitals by city/district
- **Search Functionality**: Quick hospital search
- **Alert Banner**: Scrolling critical alerts
- **Color-Coded Status**: Visual indicators for resource availability

### Ambulance Dispatcher
- **Geolocation**: Browser-based location detection
- **Nearest Hospital Search**: Find top 5 nearest hospitals with required resources
- **Distance & ETA Calculation**: Haversine formula for accurate distances
- **Quick Actions**: One-tap call and Google Maps directions
- **Resource Filtering**: Filter by bed type or blood group

### Hospital Staff Panel
- **Secure Authentication**: Supabase Auth integration
- **Real-time Inventory Management**: Update bed and blood counts
- **Increment/Decrement Controls**: Easy +/- buttons for quick updates
- **Update History**: Audit trail of all changes
- **Role-based Access**: Staff can only update their assigned hospital

### Admin Dashboard
- **District-wide Overview**: View all hospitals in a district
- **Alert Management**: Resolve critical alerts
- **Data Export**: CSV download of current snapshot
- **Summary Statistics**: Total beds, ICU availability, critical alerts
- **Hospital Table**: Comprehensive overview with key metrics

### AI-Powered Recommendations
- **Claude AI Integration**: Intelligent hospital recommendations
- **Context-Aware**: Considers patient condition, distance, and availability
- **Natural Language**: Easy-to-understand recommendations

### Real-time Alerts
- **Automatic Threshold Monitoring**: Triggers alerts for critical shortages
- **SMS Notifications**: Twilio integration for district health officers
- **Severity Levels**: Critical, High, Medium, Low
- **Auto-generated Messages**: Clear, actionable alert messages

## 🛠️ Tech Stack

### Frontend
- **React 18** with Vite
- **Tailwind CSS** for styling
- **Socket.io Client** for real-time updates
- **React Router** for navigation
- **Axios** for API calls
- **Leaflet.js** for maps (optional)

### Backend
- **Node.js** with Express.js
- **Socket.io** for WebSocket connections
- **Supabase** (PostgreSQL) for database
- **Twilio** for SMS alerts
- **Anthropic Claude** for AI recommendations

### Database
- **Supabase PostgreSQL** with Row Level Security
- **Real-time subscriptions** enabled
- **Automatic triggers** for timestamps and alerts

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- Twilio account (optional, for SMS)
- Anthropic API key (optional, for AI features)

## 🚀 Quick Start

### 1. Clone and Install

```bash
cd meditrack

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema:

```bash
# Copy the schema file content
cat supabase_schema.sql
```

3. Paste and execute in Supabase SQL Editor

### 3. Environment Variables

#### Backend (.env)

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key

# Optional but recommended
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890
DISTRICT_OFFICER_PHONE=+919876543210

# Optional for AI features
ANTHROPIC_API_KEY=your_anthropic_key

PORT=5000
FRONTEND_URL=http://localhost:5173
```

#### Frontend (.env)

```bash
cd client
cp .env.example .env
```

Edit `client/.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=http://localhost:5000
```

### 4. Seed Database (Optional)

```bash
cd server
node seed.js
```

This creates 12 sample Mumbai hospitals with realistic data.

### 5. Run Development Servers

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

Visit `http://localhost:5173` 🎉

## 📱 Pages

| Route | Description | Auth Required |
|-------|-------------|---------------|
| `/` | Public Dashboard | No |
| `/ambulance` | Ambulance Dispatcher | No |
| `/staff` | Hospital Staff Panel | Yes |
| `/admin` | Admin Dashboard | Yes (Admin role) |

## 🔐 Authentication

### Creating Staff Accounts

1. Go to Supabase Dashboard → Authentication → Users
2. Create a new user with email/password
3. Note the user UUID
4. Insert into `hospital_staff` table:

```sql
INSERT INTO hospital_staff (user_id, hospital_id, role, name, phone)
VALUES (
  'user-uuid-from-step-3',
  'hospital-uuid',
  'data_entry', -- or 'admin', 'doctor', 'nurse'
  'Staff Name',
  '+919876543210'
);
```

## 🌐 API Endpoints

### Hospitals
- `GET /api/hospitals` - Get all hospitals
- `GET /api/hospitals/:id` - Get single hospital

### Beds
- `GET /api/beds` - Get bed availability
- `PATCH /api/beds/:id` - Update bed count (auth required)

### Blood
- `GET /api/blood` - Get blood availability
- `PATCH /api/blood/:id` - Update blood units (auth required)

### Ambulance
- `POST /api/ambulance/nearest` - Find nearest hospitals

### Alerts
- `GET /api/alerts` - Get alerts
- `POST /api/alerts/:id/resolve` - Resolve alert (admin only)

### AI
- `POST /api/ai/recommend` - Get AI recommendations

## 🔔 Alert Thresholds

| Resource | Threshold | Severity | Action |
|----------|-----------|----------|--------|
| ICU beds < 2 | Critical | 🔴 Critical | SMS sent |
| ICU beds < 5 | High | 🟠 High | Alert created |
| Any bed type = 0 | Critical | 🔴 Critical | SMS sent |
| Blood units = 0 | Critical | 🔴 Critical | SMS sent |
| Blood units ≤ 3 | High | 🟠 High | Alert created |

## 🎨 Color Scheme

- **Background**: Deep Navy (#0A1628)
- **Critical**: Red (#E53E3E)
- **Warning**: Amber (#F6AD55)
- **Available**: Green (#48BB78)
- **Info**: Blue (#4299E1)

## 📊 Real-time Events

Socket.io events emitted by server:

- `bed_updated` - When bed count changes
- `blood_updated` - When blood units change
- `alert_created` - When new alert is created
- `critical_shortage` - Critical resource shortage

Clients join city-based rooms for location-specific updates.

## 🚢 Deployment

### Backend (Render)

1. Create Render account at [render.com](https://render.com)
2. New Web Service → Connect GitHub repository
3. Configure:
   - **Name**: meditrack-backend
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
4. Add environment variables (same as `.env`)
5. Deploy

**Live Backend**: https://meditrack-backend-daxo.onrender.com

### Frontend (Vercel)

1. Create Vercel account at [vercel.com](https://vercel.com)
2. Import GitHub repository
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_URL` (set to your Render backend URL)
6. Deploy

**Live Frontend**: https://meditrack-deepesh-m1oz95g6l-deepeshyadav2504006-4769s-projects.vercel.app/

## 🧪 Testing

### Test Ambulance Dispatcher

Use Mumbai coordinates:
- Latitude: `19.0760`
- Longitude: `72.8777`

### Test Real-time Updates

1. Open Public Dashboard in one tab
2. Open Staff Panel in another
3. Update bed/blood counts
4. Watch real-time updates on dashboard

## 🐛 Troubleshooting

### Socket.io not connecting
- Check CORS settings in `server/server.js`
- Verify `FRONTEND_URL` in backend `.env`
- Check browser console for errors

### Authentication failing
- Verify Supabase credentials
- Check RLS policies are enabled
- Ensure user exists in `hospital_staff` table

### SMS not sending
- Verify Twilio credentials
- Check phone number format (E.164)
- Review Twilio console logs

## 📝 License

MIT License - feel free to use for hackathons, projects, or production!

## 🤝 Contributing

This is a complete production-ready system. Feel free to:
- Add more features (maps, charts, notifications)
- Improve UI/UX
- Add more hospital data
- Enhance AI recommendations

## 📧 Support

For issues or questions, please check:
1. Environment variables are correctly set
2. Database schema is properly executed
3. All dependencies are installed
4. Ports 5000 and 5173 are available

---

Built with ❤️ for emergency healthcare resource management
