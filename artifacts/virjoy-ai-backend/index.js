require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');

// Import Routes
const videoRoutes = require('./routes/videoRoutes');
const creditRoutes = require('./routes/creditRoutes');

// Import Cron Job
const { autoDeleteExpiredVideos } = require('./services/cronService');

// Initialize Express App
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL and Service Role Key are required. Make sure to create a .env file.');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    transport: WebSocket,
  },
});

// Use Routes
app.use('/api/video', videoRoutes);
app.use('/api/credits', creditRoutes);

// A simple test route
app.get('/', (req, res) => {
  res.send('VirJoy AI Backend is up and running!');
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Start Cron Job
autoDeleteExpiredVideos.start();
console.log('Cron job for auto-deleting expired videos has been started.');


// Export supabase for use in other files
module.exports = { supabase };
