import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { checkSubscription, getSubscribedChannels, getUserChannelSubscribers, toggleSubscription } from "../controllers/subscription.controller.js";

const router = Router()


router.route("/toggle-subscription/:channelid").get(verifyJWT, toggleSubscription)
router.route("/check-subscription/:channelid").get(verifyJWT, checkSubscription)
router.route("/get-subscribers/:channelId").get(verifyJWT, getUserChannelSubscribers)
router.route("/get-subscriptions/:subscriberId").get(verifyJWT, getSubscribedChannels)


export default router