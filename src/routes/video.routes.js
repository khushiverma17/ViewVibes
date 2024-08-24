import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getAllVideos, getAllVideosInApp, updateVideo } from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router()


router.route("/get-all-videos/:userid/:username").get(verifyJWT, getAllVideos)
router.route("/get-all-videos-in-app").get(verifyJWT, getAllVideosInApp)
router.route("/update-video/:videoId").patch(verifyJWT, 
    upload.fields([
        {
            name: "thumbnail",
            maxCount: 1
        },
    ]),
    updateVideo)


export default router