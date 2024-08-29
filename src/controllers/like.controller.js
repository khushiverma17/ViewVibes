import mongoose, { isValidObjectId, mongo } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //toggle like on video
    console.log(req.user?._id);
    
    const userId = req.user._id
    if (!videoId) {
        throw new ApiError(400, "Video id is not provided")
    }
    if(!userId){
        throw new ApiError(400, "User id is not provided")
    }

    const like = await Like.findOne({
        video: videoId,
        likedBy: userId
    })

    if (like) {
        await Like.deleteOne({
            _id: like._id
        })
    } else {
        const newLike = new Like({
            video: videoId,
            likedBy: userId
        })
        await newLike.save()
    }
    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Video like toggled successfully")
        )


})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    // toggle like on comment
    const userId = req.user

    if (!commentId) {
        throw new ApiError(400, "Comment id is not provided")
    }
    if(!userId){
        throw new ApiError(400, "UserId is not provided")
    }

    const comment = await Like.findOne({
        comment: commentId,
        likedBy: userId
    })

    if (comment) {
        await Like.deleteOne({
            // _id: comment._id
            comment:comment._id
        })
    } else {
        const newComment = new Like({
            comment: commentId,
            likedBy: userId
        })
        await newComment.save()
    }
    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Comment like toggled successfully")
        )

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    // toggle like on tweet
    const { userId } = req.user

    if (!tweetId || !userId) {
        throw new ApiError(400, "Tweet id or user id is not provided")
    }

    const tweet = await Like.findOne({
        tweet: tweetId,
        likedBy: userId
    })

    if (tweet) {
        const updatedTweet = await Like.findByIdAndDelete(tweet._id)
    } else {
        const newTweet = new Like({
            tweet: tweetId,
            likedBy: userId
        })
        await newTweet.save()
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Tweet like toggled successfully")
        )





}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //get all liked videos

    const { userId } = req.user

    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                foreignField: "_id",
                localField: "video",
                as: "likedVideo",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            foreignField: "_id",
                            localField: "owner",
                            as: "ownerDetails",
                        }
                    },
                    {
                        $unwind: "$ownerDetails"
                    }
                ]
            }
        },
        {
            $unwind: "$likedVideo"
        },
        {
            $sort: {
                createdAt: -1,
            }
        },
        {
            $project: {
                _id: 1,
                likedVideo: {
                    _id: 1,
                    videoFile: 1,
                    thumbnail: 1,
                    owner: 1,
                    title: 1,
                    description: 1,
                    // thumbnail: 1, 
                    views: 1,
                    duration: 1,
                    createdAt: 1,
                    isPublished: 1,
                    ownerDetails: {
                        username: 1,
                        fullName: 1,
                        avatar: 1,
                        _id: 1
                    }
                }
            }
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(200, likedVideos, "Liked videos fetched successfully")
        )
})

const checkLikeStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const userId = req.user._id

    const likedVideo = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user?._id),
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideo"

            }
        },
        {
            $unwind: "$likedVideo"
        },
        {
            $lookup:{
                from: "users",
                localField: "likedVideo.owner",
                foreignField: "_id",
                as: "ownerDetails",
            }
        },
        {
            $unwind:"$ownerDetails"
        },
        {
            $project: {
                _id: 0,
                likedVideo: {
                    _id: 1,
                    title: 1,
                    description: 1,
                    "thumbnail.url": 1,
                    "videoFile.url": 1,
                    owner: 1,
                    views: 1,
                    duration: 1,
                    createdAt: 1,
                    isPublished: 1,
                    ownerDetails: {
                        username: 1,
                        fullName: 1,
                        "avatar.url": 1,
                    }
                }
            }
        }
    ])

    if (likedVideo.length > 0) {
        return res.status(200).json(
            new ApiResponse(200, { isLiked: true, likedVideo: likedVideo[0].likedVideo }, "Video is liked by the user")
        );
    } else {
        return res.status(200).json(
            new ApiResponse(200, { isLiked: false }, "Video is not liked by the user")
        );
    }

})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos, 
    checkLikeStatus
}