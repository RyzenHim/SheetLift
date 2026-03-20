require("dotenv").config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: ["http://localhost:5173", "https://sheetlift.netlify.app/"],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/test', (req, res) => res.json({ message: 'Backend working!' }));

app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api', require('./src/routes/task.routes'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

console.log('Server starting...');

mongoose.connect(process.env.URI)
  .then(() => console.log("✅ DB connected"))
  .catch((error) => {
    console.log("⚠️ DB connection error (non-fatal):", error.message);
    console.log("Endpoints still available for testing.");
  });

app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});

