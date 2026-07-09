require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();

// app.use(cors({ origin: ['https://archive.stbg.tn'] }));
app.use(cors({ origin: ['https://archive.stbg.tn', 'http://localhost:5174'] })); // http://localhost:5174' has been blocked by CORS policy
app.use(express.json());

// Configuration du rate limiting pour le login (10 essais / 15 minutes)
const loginLimit = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  message: { message: "Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes." }
});

app.use('/api/auth/login', loginLimit);


// TEST ENDPOINT
app.get('/api/test', (req, res) => {
  console.log('Hit /api/test endpoint');
  res.json({ message: 'Test endpoint works' });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/archives', require('./routes/archives'));
app.use('/api/consultations', require('./routes/consultations'));
app.use('/api/notifications', require('./routes/notifications'));

console.log('Loading document_types route...');
const docTypesRouter = require('./routes/document_types');
console.log('Document types router loaded:', typeof docTypesRouter);
app.use('/api/document-types', docTypesRouter);

// Error handler middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message || err);
  const status = err.status || 500;
  
  if (process.env.NODE_ENV === 'development') {
    res.status(status).json({ 
      error: err.message || 'Internal Server Error',
      details: err.stack
    });
  } else {
    res.status(status).json({ 
      error: 'Internal Server Error'
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});