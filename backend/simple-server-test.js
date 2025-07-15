const express = require('express');

const app = express();
const port = 5001; // Use different port

app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!', timestamp: new Date() });
});

app.listen(port, () => {
  console.log(`Simple test server running on port ${port}`);
  console.log(`Visit: http://localhost:${port}/test`);
});
