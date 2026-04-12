const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
const { router: guardianAuthRouter } = require('./routes/guardianAuthRoutes');
const guardianVitalsRouter = require('./routes/guardianVitalsRoutes');
const guardianReportsRouter = require('./routes/guardianReportsRoutes');

app.use('/api/guardian/auth', guardianAuthRouter);
app.use('/api/guardian/vitals', guardianVitalsRouter);
app.use('/api/guardian/reports', guardianReportsRouter);

// MongoDB connect — patient wala same DB use karo
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Guardian Backend — MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Guardian server running on port ${PORT}`));