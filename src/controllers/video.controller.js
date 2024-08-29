import mongoose, { isValidObjectId } from "mongoose"

import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { Like } from "../models/like.model.js"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    // get all videos based on query, sort, pagination

    if (!userId) {
        throw new ApiError(400, "User id is not provided")
    }

    const pipeline = [];


    if (query) {
        pipeline.push({
            $search: {
                index: "search-videos",
                text: {
                    query: query,
                    path: ["title", "description"]
                }
            }
        })
    }


    pipeline.push({
        $match: {
            owner: new mongoose.Types.ObjectId(userId)
        }
    })


    // pipeline.push({
    //     $match: {
    //         isPublished: true
    //     }
    // })


    //sortBy can be views, createdAt, duration
    //sortType can be ascending(-1) or descending(1)
    if (sortBy && sortType) {
        pipeline.push({
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1
            }
        })
    } else {
        pipeline.push({
            $sort: {
                createdAt: -1
            }
        })
    }


    pipeline.push(
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
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
            $unwind: "$ownerDetails"
        }
    )


    const videoAggregate = Video.aggregate(pipeline)

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    }

    const video = await Video.aggregatePaginate(videoAggregate, options)

    return res
        .status(200)
        .json(
            new ApiResponse(200, video, "Videos fetched successfully")
        )
})

const publishAVideo = asyncHandler(async (req, res) => {
    // console.log("Printing request from the frontend");
    console.log("Req.files is: ", req.files);


    // console.log(req.body);

    // console.log(req.files)

    const { title, description } = req.body
    // console.log("hello");

    // get video, upload to cloudinary, create video

    if (!title || !description) {
        throw new ApiError(400, "Title or Description is not provided")
    }
    // if(req.files){
    //     console.log(req.files);

    // }



    const thumnailFileLocalPath = req.files?.thumbnail[0].path
    // const videoFileLocalPath = req.files?.videoFile[0].path
    const videoFileLocalPath = req.files?.video[0].path //I HAVE CHANGED THIS

    // console.log(thumnailFileLocalPath);
    // console.log((videoFileLocalPath));




    if (!videoFileLocalPath) {
        throw new ApiError(400, "Video local path is required")
    }

    if (!thumnailFileLocalPath) {
        throw new ApiError(400, "Thumbnail local path is required")
    }
    console.log(videoFileLocalPath, thumnailFileLocalPath);


    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnail = await uploadOnCloudinary(thumnailFileLocalPath)

    console.log(videoFile);
    console.log(thumbnail);




    if (!videoFile) {
        throw new ApiError(400, "Video not found")
    }
    if (!thumbnail) {
        throw new ApiError(400, "Thumbnail not found")
    }

    // const video = await Video.create({
    //     title,
    //     description,
    //     duration: videoFile.duration,
    //     videoFile: {
    //         url: videoFile.url,
    //         public_id: videoFile.public_id
    //     },
    //     thumbnail: {
    //         url: thumbnail.url,
    //         public_id: thumbnail.public_id
    //     },
    //     owner: req.user?._id,
    //     isPublished: false
    // })

    const video = await Video.create({
        title,
        description,
        duration: videoFile.duration,
        videoFile: videoFile.url, // Store only the URL
        thumbnail: thumbnail.url,  // Store only the URL
        owner: req.user?._id,
        isPublished: true
    });


    const uploadedVideo = await Video.findById(video._id)
    console.log("Your video has been uploaded successfully");


    if (!uploadedVideo) {
        throw new ApiError(400, "Cannot upload video")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, video, "Video uploaded successfully")
        )

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //get video by id

    if (!videoId) {
        throw new ApiError(400, "Video id is not provided")
    }

    const userId = req.user
    if (!userId) {
        throw new ApiError(400, "UserId is not provided")
    }

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribers"
                        }
                    },
                    {
                        $addFields: {
                            subscribersCount: {
                                $size: "$subscribers"
                            },
                            isSubscribed: {
                                $cond: {
                                    if: {
                                        $in: [
                                            req.user?._id,
                                            "$subscribers.subscriber"
                                        ]
                                    },
                                    then: true,
                                    else: false
                                }
                            }
                        },

                    },
                    {
                        $project: {
                            username: 1,
                            avatar: 1,
                            subscribersCount: 1,
                            isSubscribed: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likes"
                },
                owner: {
                    $first: "$owner"
                },
                isLiked: {
                    $cond: {
                        if: {
                            $in: [req.user?._id, "$likes.likedBy"]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                videoFile: 1,
                title: 1,
                description: 1,
                views: 1,
                createdAt: 1,
                duration: 1,
                comments: 1,
                owner: 1,
                likesCount: 1,
                isLiked: 1
            }
        }






    ])

    if (!video) {
        throw new ApiError(400, "Failed to fetch video")
    }

    //increment views
    await Video.findByIdAndUpdate(videoId, {
        $inc: {
            views: 1
        }
    })

    //add it to user watch history
    await User.findByIdAndUpdate(req.user?._id, {
        $addToSet: {
            watchHistory: videoId
        }
    })

    return res
        .status(200)
        .json(
            new ApiResponse(200, video[0], "Video and its details fetched successfully")
        )



})



const updateVideo = asyncHandler(async (req, res) => {
    console.log(req.files);
    
    const { videoId } = req.params
    const { title, description } = req.body

    if (!videoId) {
        throw new ApiError(400, "Video id is not provided")
    }

    if (!title || !description) {
        throw new ApiError(400, "Title and description are required")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(400, "Video does not exists")
    }

    if (video.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "Only owner can update the video")
    }

    //updating the thumbnail
    const oldThumbnail = video.thumbnail.public_id;
    console.log(req.files.thumbnail[0].path);
    const thumbnailLocalPath = req.files.thumbnail[0].path
    
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail is required`")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    if(!thumbnail.url){
        throw new ApiError(400, "Error while updating thumbnail")
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                // thumbnail: {
                //     // public_id: thumbnail.public_id,
                //     url: thumbnail.url
                // }
                thumbnail: thumbnail.url
            }
        },
        { new: true }
    )

    if (!updatedVideo) {
        throw new ApiError(400, "Failed to update the video")
    }

    if (updatedVideo) {
        await deleteOnCloudinary(oldThumbnail)
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedVideo, "Video updated successfully")
        )



})

const deleteVideo = asyncHandler(async (req, res) => {

    const { videoId } = req.params
    console.log(videoId)

    if (!videoId) {
        throw new ApiError(400, "Video id is not provided")
    }


    //delete from like, from user, comments, playlist

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(400, "Video does not exist")
    }

    //pipelines

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(400, "Only owner can delete the video")
    }

    const deletedVideo = await Video.findByIdAndDelete(video?._id)

    if (!deletedVideo) {
        throw new ApiError(400, "Failed to delted the video")
    }

    await deleteOnCloudinary(video.thumbnail.public_id)
    await deleteOnCloudinary(video.videoFile.public_id, "video")

    await Like.deleteMany({
        video: videoId
    })

    await Comment.deleteMany({
        video: videoId
    })

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Video deleted successfully")
        )




})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!videoId) {
        throw new ApiError(400, "Video id is not provided")
    }

    const video = Video.findById(videoId)

    if (!video) {
        throw new ApiError(400, "Video not found")
    }

    if (video.owner.toString() != req.user?._id.toString()) {
        throw new ApiError(400, "Only owner can toggle the status of video")
    }

    const toggledVideoPublishStatus = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: !video?.isPublished
            }
        },
        { new: true }
    )

    if (!togglePublishStatus) {
        throw new ApiError(400, "Failed to toggle the video publish status")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, { isPublished: togglePublishStatus?.isPublished }, "Video publish status toggled successfully")
        )


})

const getAllVideosInApp = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType } = req.query

    const pipeline = [];

    if (query) {
        pipeline.push({
            $search: {
                index: "search-videos",
                text: {
                    query: query,
                    path: ['title', 'description'],
                }
            }
        })
    }

    if (sortBy && sortType) {
        pipeline.push({
            $sort: {
                [sortBy]: sortType === 'asc' ? 1 : -1,
            }
        })
    }
    else {
        pipeline.push({
            $sort: {
                createdAt: -1
            }
        })
    }

    // {
    //     $lookup: {
    //         from: "users",
    //         localField: "owner",
    //         foreignField: "_id",
    //         as: "ownerDetails",
    //         pipeline: [
    //             {
    //                 $project: {
    //                     username: 1,
    //                     "avatar.url": 1

    //                 }
    //             }

    //         ]
    //     }
    // }

    pipeline.push(
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            "avatar.url": 1,
                        }
                    }
                ]
            }
        }
    )

// Unwind the ownerDetails array to convert it to an object
pipeline.push({
    $unwind: "$ownerDetails"
});

    const videoAggregate = Video.aggregate(pipeline)

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    }

    const videos = await Video.aggregatePaginate(videoAggregate, options)

    return res.status(200).json(new ApiResponse(200, videos, "All videos fetched successfully"))

})




export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    getAllVideosInApp
}