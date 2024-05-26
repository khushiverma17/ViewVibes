import {asyncHandler} from "../utils/asynHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"


const registerUser = asyncHandler(async(req, res) => {
    // get user details from frontend
    // validation- non empty
    // check if user already exists: username, email
    // check for images, avatar
    // upload them to cloudinary
    // create user obj : entry in db
    // remove password and refresh token from response
    // check for user creation
    // return response


    //if data is not from url
    const {fullName, email, username, password} = req.body
    console.log("Email is ", email)

    // if(fullName === ""){
    //     throw new ApiError(400, "fullName is required")
    // }


    if(
        [fullName, email, username, password].some((field) => 
        field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are compulsary")
    }


    // "User" can contact with mongodb because it is made with mongoose
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if(existedUser){
        throw new ApiError(409, "User with username or email already exists")
    }


    //from multer
    const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath=req.files.coverImage[0].path
    }

    //check for avatar
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }

    //uploading to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }


    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()    //issue

    })

    //check if the entry is made or not
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering user")
    }


    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )



    






})

export {registerUser}