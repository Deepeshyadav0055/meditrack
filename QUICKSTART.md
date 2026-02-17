# MediTrack - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Set up Supabase (2 min)
1. Go to https://supabase.com and create a free account
2. Create a new project
3. Go to SQL Editor → New Query
4. Copy and paste the entire contents of `supabase_schema.sql`
5. Click "Run" to execute
6. Go to Settings → API to get your keys:
   - Project URL
   - `anon` public key
   - `service_role` secret key

### Step 2: Configure Environment Variables (1 min)

**Backend** (`server/.env`):
```bash
cd server
cp .env.example .env
```

Edit `server/.env` and add your Supabase credentials:
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...  # service_role key

# Optional (can skip for now)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
DISTRICT_OFFICER_PHONE=

ANTHROPIC_API_KEY=

PORT=5000
FRONTEND_URL=http://localhost:5173
```

**Frontend** (`client/.env`):
```bash
cd client
cp .env.example .env
```

Edit `client/.env`:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...  # anon key
VITE_API_URL=http://localhost:5000
```

### Step 3: Seed Database (1 min)
```bash
cd server
node seed.js
```

You should see:
```
✅ Inserted 12 hospitals
✅ Inserted 84 bed inventory records
✅ Inserted 96 blood inventory records
✅ Created 5 sample alerts
```

### Step 4: Run the Application (1 min)

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

You should see:
```
🏥 MediTrack API server running on port 5000
📡 Socket.io enabled for real-time updates
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

You should see:
```
VITE ready in XXX ms
➜  Local:   http://localhost:5173/
```

### Step 5: Test the Application ✅

1. **Public Dashboard**: Open http://localhost:5173
   - You should see 12 Mumbai hospitals
   - Each showing bed and blood availability
   - Alert banner at top if there are critical alerts

2. **Ambulance Dispatcher**: Go to http://localhost:5173/ambulance
   - Click "Use My Location" (or enter: Lat 19.0760, Long 72.8777)
   - Select "ICU"
   - Click "SEARCH"
   - You should see 5 nearest hospitals with distances

3. **Test Real-time Updates**:
   - Keep Public Dashboard open in one tab
   - Open http://localhost:5173/staff in another tab
   - Login (you'll need to create a staff account first - see below)

---

## 👤 Creating a Staff Account

Since we don't have a signup page, create staff accounts via Supabase:

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add user" → "Create new user"
3. Enter email: `staff@kemhospital.org`
4. Enter password: `password123`
5. Click "Create user"
6. Copy the User UID (looks like: `a1b2c3d4-...`)

7. Go to SQL Editor and run:
```sql
-- Get KEM Hospital ID first
SELECT id, name FROM hospitals WHERE name LIKE '%KEM%';

-- Insert staff record (replace the UUIDs with actual values)
INSERT INTO hospital_staff (user_id, hospital_id, role, name, phone)
VALUES (
  'USER_UID_FROM_STEP_6',
  'HOSPITAL_ID_FROM_QUERY_ABOVE',
  'data_entry',
  'Dr. Sharma',
  '+919876543210'
);
```

8. Now you can login at http://localhost:5173/staff with:
   - Email: `staff@kemhospital.org`
   - Password: `password123`

---

## 🧪 Testing Real-time Features

1. **Login as staff** (using account created above)
2. **Update ICU beds** to 1 (click the - button)
3. **Switch to Public Dashboard tab**
4. **Watch it update instantly** ✨
5. **Check the alert banner** - should show critical ICU alert

---

## 📱 Test on Mobile

1. Find your computer's local IP:
   ```bash
   # Mac/Linux
   ifconfig | grep "inet "
   
   # Windows
   ipconfig
   ```

2. Update `FRONTEND_URL` in `server/.env`:
   ```env
   FRONTEND_URL=http://YOUR_IP:5173
   ```

3. Restart backend server

4. On your phone, visit: `http://YOUR_IP:5173`

---

## ❓ Troubleshooting

### "Failed to fetch hospitals"
- Check backend is running on port 5000
- Check `VITE_API_URL` in `client/.env`
- Check browser console for CORS errors

### "Socket.io not connecting"
- Check `FRONTEND_URL` in `server/.env` matches your frontend URL
- Check browser console for WebSocket errors

### "Authentication failed"
- Verify Supabase credentials in both `.env` files
- Check user exists in Supabase Auth
- Check `hospital_staff` record exists

### "No hospitals showing"
- Run `node seed.js` again
- Check Supabase → Table Editor → hospitals table has data
- Check browser console for errors

---

## 🎉 Success Checklist

- [ ] Backend running on port 5000
- [ ] Frontend running on port 5173
- [ ] Public Dashboard shows 12 hospitals
- [ ] Ambulance search works with geolocation
- [ ] Staff login works
- [ ] Real-time updates work (update bed count, see it on dashboard)
- [ ] Alerts appear when ICU < 2

---

## 📚 Next Steps

1. **Add more hospitals**: Run seed.js with different cities
2. **Configure Twilio**: Get SMS alerts working
3. **Add Claude API**: Enable AI recommendations
4. **Deploy**: Follow deployment guide in README.md
5. **Customize**: Add your hospital data

---

## 🆘 Need Help?

Check the main [README.md](./README.md) for:
- Complete API documentation
- Deployment instructions
- Architecture details
- Feature explanations

The system is fully functional with just Supabase configured. Twilio and Claude are optional enhancements!
