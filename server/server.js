const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// DEBUG: Log all requests
app.use((req, res, next) => {
  console.log('Incoming request:', req.method, req.path);
  next();
});

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

// Error handler middleware - must be last
app.use((err, req, res, next) => {
  console.error('Error:', err.message || err);
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});