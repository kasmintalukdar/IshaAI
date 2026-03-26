const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { protect } = require('../middlewares/auth.middleware');

// Combined dashboard — single call, pure local math, no Python dependency
router.get('/dashboard', protect, aiController.getDashboard);

// Ishaa V2 proxy — forwards to Python FastAPI for real LLM features
router.all('/v2/ishaa/*', aiController.getIshaaV2Response);

module.exports = router;
