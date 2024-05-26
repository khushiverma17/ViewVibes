import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"


const generateAccessAndRefreshTokens = async(userId) => {
    try{
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        //put refresh token in db also 
        user.refreshToken=refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}


    }catch(error){
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}


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


const loginUser = asyncHandler(async(req, res) => {
    // take data from req.body
    // check username or email is provided
    // find user
    // check password
    // generate and provide access and refresh token
    // send token in cookies

    const {email, username, password} = req.body;


    //both are provided
    if(!username || !email){
        throw new ApiError(400, "username or password is required")
    }

    const user = await User.findOne({
        $or : [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(404, "Invalid user credentials")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)


    //previous variable user has empty refresh token so make another query so that we get updated details of the user
    const loggedInUser = await User.findById(user._id).
    select("-password -refreshToken")
    
    //send in cookie
    const options = {
        //only server can modify the cookies (by default they can be modified by anyone in the frontend)
        httpOnly: true,
        secure:true
    }

    return res.
    status(200).
    cookie("accessToken", accessToken, options).
    cookie("refreshToken", refreshToken, options).
    json(
        new ApiResponse(
            200,
            //data
            {
                user: loggedInUser, accessToken, refreshToken
            },
            //data completed
            "User logged in Successfully"
        )
    )







})

const logoutUser = asyncHandler(async(req, res) => {
    //reset cookies and reset refreshToken
    // design a middleware

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly:true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {}, "User logged out successfully")
    )


})



export {registerUser, loginUser, logoutUser}