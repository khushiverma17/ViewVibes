import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {checkLikeStatus, getLikedVideos, toggleCommentLike, toggleTweetLike, toggleVideoLike} from "../controllers/like.controller.js"

const router = Router()


router.route("/toggle-video-like/:videoId").post(verifyJWT, toggleVideoLike)

router.route("/toggle-comment-like/:commentId").post(verifyJWT, toggleCommentLike)

router.route("/toggle-tweet-like/:tweetId").post(verifyJWT, toggleTweetLike)

router.route("/liked-videos").get(verifyJWT, getLikedVideos)

router.route("/check-like-status/:videoId").get(verifyJWT, checkLikeStatus)

export default router