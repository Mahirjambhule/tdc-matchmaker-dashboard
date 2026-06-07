// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const customerRoutes = require('./routes/customerRoutes');
const customerController = require('./controllers/customerController'); // 👈 ADD THIS IMPORT

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// 1. Your existing routes mount configuration
app.use('/api/customers', customerRoutes);

// 2. FORCE BINDING THE AI PATH DIRECTLY (ADD THIS LINE)
// This perfectly handles the POST request coming from frontend api.js
app.post('/api/customers/ai/analyze', customerController.getAIMatchAnalysis);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ Successfully connected to MongoDB Atlas');
    app.listen(PORT, () => {
      console.log(`🚀 Server is running smoothly on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ Database connection error:', error.message);
    process.exit(1);
  });

app.get('/', (req, res) => {
  res.status(200).json({ message: "TDC Matchmaker API is live and healthy!" });
});