const express = require('express');
const router = express.Router();
const authController=require("../controllers/auth-controller");


router.route("/").get(authController.Home);
router.route("/register").post(authController.Register);
router.route("/:eventId/register").post(authController.RegisterForEvent);
router.route("/:eventId/cancel").post(authController.CancelRegistration);
router.route("/:eventId").get(authController.GetEventDetails);
router.route("/events/upcoming").get(authController.GetUpcomingEvents);
router.route("/:eventId/stats").get(authController.GetEventStats);

module.exports = router;