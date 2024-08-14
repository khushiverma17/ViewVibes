import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getAllVideos } from "../controllers/video.controller.js";

const router = Router()


router.route("/get-all-videos/:userid/:username").get(verifyJWT, getAllVideos)


export default router