// it will verify if the user is there or not and is used in logout functionality
//if the user is verified means it has correct access and refresh tok add a new object in req named user req.user

import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";



export const verifyJWT = asyncHandler(async(req, _, next) => {
    //access token from cookies but in case of mobile app in which cookies are not there, then get the token from header of postman with key Authorisation and key Bearer <token>
    try{const token = req.cookies?.accessToken || req.header("Authorisation")?.replace("Bearer ", "")

    if(!token){
        throw new ApiError(404, "Unauthorised request")
    }

    //check if the token is correct
    //DOCUMENTAION
    // function verify(token: string, secretOrPublicKey: jwt.Secret, options: jwt.VerifyOptions & {
    //     complete: true;
    // }): jwt.Jwt (+6 overloads)
    
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

    // from usermodel
    const user = await User.findById(decodedToken?._id)
    .select("-password -refreshToken")

    if(!user){
        throw new ApiError(401, "Invalid access token")
    }

    req.user = user
    next()}catch(error){
        throw new ApiError(401, error?.message || "Invalid access token")
    }

    


})