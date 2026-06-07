const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const customerRoutes = require('./routes/customerRoutes');
const customerController = require('./controllers/customerController');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/customers', customerRoutes);

app.post('/api/customers/ai/analyze', customerController.getAIMatchAnalysis);

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB Atlas');
    app.listen(PORT, () => {
      console.log(`erver is running smoothly on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Database connection error:', error.message);
    process.exit(1);
  });

app.get('/', (req, res) => {
  res.status(200).json({ message: "TDC Matchmaker API is live and healthy!" });
});