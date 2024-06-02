
import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    // create tweet
    const {content} = req.body

    if(!content){
        throw new ApiError(400, "Content of tweet is not provided")
    }

    const userId = req.user;

    if(!userId){
        throw new ApiError(400, "User id is not provided")
    }

    const tweet = await Tweet.create({
        content,
        owner: user?._id
    })

    if(!tweet){
        throw new ApiError(400, "Failed to create a tweet")
    }

    return res.
    status(200)
    .json(
        new ApiResponse(200, tweet, "Tweet created successfully")
    )
})

const getUserTweets = asyncHandler(async (req, res) => {
    // get user tweets
    
    const userId=req.params

    if(!userId){
        throw new ApiError(400, "User id does not exists")
    }

    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as : "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            "avatar.url": 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from : "likes",
                foreignField: "tweet",
                localField: "_id",
                as: "likeDetails",
                pipeline: [
                    {
                        $project: {
                            likedBy: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                likesCount: {
                    $size: "likeDetails"
                },
                ownerDetails: {
                    $first: "ownerDetails"
                },
                isLiked: {
                    $cond: {
                        if: {$in: [req.user?._id, "$likeDetails.likedBy"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $project: {
                content: 1,
                ownerDetails: 1,
                likesCount: 1,
                createdAt: 1,
                isLiked: 1
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200, tweets, "Tweets fetched successfully")
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    //update tweet

    const {content} = req.body
    const {tweetId} = req.params

    if(!content || !tweetId){
        throw new ApiError(400, "Content and Tweet id are necessary")
    }

    const tweet = await Tweet.findById(tweetId)

    if(tweet.owner.toString() != req.user?._id.toString()){
        throw new ApiError(400, "Only owner can update the tweet")
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content: content
            }
        },
        {new: true}
    )

    if(!updatedTweet){
        throw new ApiError(400, "Failed to update the tweet")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedTweet, "Tweet updated successfully")
        )
})

const deleteTweet = asyncHandler(async (req, res) => {
    // delete tweet

    const {tweetId} = req.params

    if(!tweetId){
        throw new ApiError(400, "Tweet id is necessary")
    }

    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new ApiError(400, "Tweet does not exist")
    }

    if(tweet.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(400, "Only owners can delete the tweet")
    }

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId)

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Tweet deleted successfully")
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
