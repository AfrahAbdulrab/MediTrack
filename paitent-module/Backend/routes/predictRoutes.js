// ============================================================
//  Backend/routes/predictRoutes.js
// ============================================================

const express    = require("express");
const router     = express.Router();
const controller = require("../controllers/predictController");

router.post("/sleep-apnea",  controller.sleepApnea);
router.post("/heart",        controller.heart);
router.post("/hypertension", controller.hypertension);
router.post("/all",          controller.all);       // ← main wala — teeno ek saath

module.exports = router;