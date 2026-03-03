



// <<<<<<< HEAD
// =======
// // // const express = require('express');
// // // const router = express.Router();
// // // const aiController = require('../controllers/ai.controller');
// // // const { protect } = require('../middlewares/auth.middleware');

// // // // GET /api/v1/ai/profile (Persona)
// // // router.get('/profile', protect, aiController.getCognitiveProfile);

// // // // GET /api/v1/ai/mastery (New Mastery Score)
// // // router.get('/mastery', protect, aiController.getStudentMastery);

// // // module.exports = router;




// // const express = require('express');
// // const router = express.Router();
// // const aiController = require('../controllers/ai.controller');
// // const { protect } = require('../middlewares/auth.middleware');

// // router.get('/profile', protect, aiController.getCognitiveProfile);
// // router.get('/mastery', protect, aiController.getStudentMastery);
// // router.get('/exam-prediction', protect, aiController.getExamPrediction); // 👈 NEW

// // module.exports = router;







// >>>>>>> rahulpro2/main
// // const express = require('express');
// // const router = express.Router();
// // const aiController = require('../controllers/ai.controller');
// // const { protect } = require('../middlewares/auth.middleware');

// // // GET /api/v1/ai/profile (Persona)
// // router.get('/profile', protect, aiController.getCognitiveProfile);

// // // GET /api/v1/ai/mastery (New Mastery Score)
// // router.get('/mastery', protect, aiController.getStudentMastery);

// // module.exports = router;




// <<<<<<< HEAD
// =======
// // const express = require('express');
// // const router = express.Router();
// // const aiController = require('../controllers/ai.controller');
// // const { protect } = require('../middlewares/auth.middleware');

// // router.get('/profile', protect, aiController.getCognitiveProfile);
// // router.get('/mastery', protect, aiController.getStudentMastery);
// // router.get('/exam-prediction', protect, aiController.getExamPrediction); // 👈 NEW
// // router.get('/burnout-status', protect, aiController.getBurnoutStatus);

// // module.exports = router;





// >>>>>>> rahulpro2/main
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { protect } = require('../middlewares/auth.middleware');

router.get('/profile', protect, aiController.getCognitiveProfile);
router.get('/mastery', protect, aiController.getStudentMastery);

router.get('/exam-prediction', protect, aiController.getExamPrediction);
router.get('/summary', protect, aiController.getComprehensiveSummary); // 👈 Now Valid
router.get('/burnout-status', protect, aiController.getBurnoutStatus);      // 👈 Now Valid

// --- EXISTING PHASE 1 ROUTES (DO NOT TOUCH) ---
// router.post('/predict-mastery', aiController.predictMastery);
// ...

// --- NEW PHASE 2 ROUTES ---
// This uses a "catch-all" pattern. Anything starting with /v2/ishaa/ will be forwarded.
// Example: A POST to your Node server at /api/ai/v2/ishaa/ai_help/ask 
// gets forwarded to Python at http://127.0.0.1:8000/v2/ishaa/ai_help/ask
router.all('/v2/ishaa/*', aiController.getIshaaV2Response);


module.exports = router;