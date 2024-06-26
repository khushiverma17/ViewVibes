    import { Router } from "express";
    import { loginUser, logoutUser, registerUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory } from "../controllers/user.controller.js";
    import {upload} from "../middlewares/multer.middleware.js"
    import { verifyJWT } from "../middlewares/auth.middleware.js";

    const router = Router()


    // http://localhost:8000/v1/api/users/register
    router.route("/register").post(
        upload.fields([
            {
                name: "avatar",
                maxCount:1
            },
            {
                name: "coverImage",
                maxCount:1
            }
        ]),
        registerUser
    )


    router.route("/login").post(loginUser)

    // to give access to these routes only if the user is loggedin (verify using authmiddleware)
    // secured routes

    router.route("/logout").post(verifyJWT, logoutUser)

    router.route("/refresh-token").post(refreshAccessToken)

    router.route("/change-password").post(verifyJWT, changeCurrentPassword)

    router.route("/current-user").post(verifyJWT, getCurrentUser)


    // PATCH is one of the methods that can be used to request that a server apply partial modifications to a resource
    router.route("/update-account").patch(verifyJWT, updateAccountDetails)

    router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)

    router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)


    //getting details from params url const {username} = req.params
    
    router.route("/c/:username").get(verifyJWT, getUserChannelProfile)

    router.route("/history").get(verifyJWT, getWatchHistory)


    export default router