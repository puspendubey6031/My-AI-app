const express = require('express');
const router = express.Router();

// POST /api/video/create
router.post('/create', (req, res) => {
  // Mock response for video creation
  console.log('API HIT: /api/video/create');
  console.log('Request Body:', req.body);
  res.status(201).json({
    success: true,
    message: 'Video creation job started successfully.',
    jobId: `mock_${Date.now()}`,
  });
});

// GET /api/video/status/:id
router.get('/status/:id', (req, res) => {
  // Mock response for video status
  const { id } = req.params;
  console.log(`API HIT: /api/video/status/${id}`);
  res.status(200).json({
    jobId: id,
    status: 'processing', // or 'completed', 'failed'
    progress: 50,
    outputUrl: null,
  });
});

module.exports = router;
