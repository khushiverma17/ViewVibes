import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    console.log("hdlk");

    const { videoId } = req.params
    // It also extracts the page and limit query parameters from the request (req.query)
    //get all comments for a video

    // When a client makes a GET request to a server with query parameters in the URL (e.g., http://example.com/resource?param1=value1&param2=value2), Express parses these parameters and makes them available in the req.query object.If page or limit are not present in req.query, they will default to 1 and 10 respectively.
    const { page = 1, limit = 10 } = req.query

    if (!videoId) {
        throw new ApiError(400, "VideoId is not provided")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(400, "Video not found")
    }

    // user and likes on the comment

    const comment = Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "owner",
                as: "owner"
            }
        },
        {
            $lookup: {
                from: "likes",
                foreignField: "comment",
                localField: "_id",
                as: "likes"
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
                        if: { $in: [req.user?._id, "$likes.likedBy"] },
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
                createdAt: 1,
                likesCount: 1,
                owner: {
                    username: 1,
                    fullName: 1,
                    avatar: 1
                },
                isLiked: 1
            }
        }
    ])

    const options = {
        //base 10
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    }

    const comments = await Comment.aggregatePaginate(
        comment,
        options
    )

    return res
        .status(200)
        .json(
            new ApiResponse(200, comments, "Comments fetched successfully")
        )







})



const addComment = asyncHandler(async (req, res) => {
    // add a comment to a video

    const { content } = req.body
    const { videoId } = req.params

    if (!content) {
        throw new ApiError(400, "Content is required to add a comment")
    }
    console.log("Video id is : ", videoId);
    console.log("conge", content)


    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(400, "Video not found")
    }


    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user?._id
    })

    if (!comment) {
        throw new ApiError(400, "Failed to add comment")
    }

    const newComment = await Comment.aggregate([
        {
            $match: {
                _id: comment._id,
            },
        },
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "owner",
                as: "owner",
            },
        },
        {
            $lookup: {
                from: "likes",
                foreignField: "comment",
                localField: "_id",
                as: "likes",
            },
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likes",
                },
                owner: {
                    $arrayElemAt: ["$owner", 0], // Use $arrayElemAt to directly get the first element from the array
                },
                isLiked: {
                    $cond: {
                        if: { $in: [req.user?._id, "$likes.likedBy"] },
                        then: true,
                        else: false,
                    },
                },
            },
        },
        {
            $project: {
                content: 1,
                createdAt: 1,
                likesCount: 1,
                owner: {
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                },
                isLiked: 1,
            },
        },
    ]);


    return res
        .status(200)
        .json(
            new ApiResponse(201, newComment[0], "Comment added successfully")
        )


})

const updateComment = asyncHandler(async (req, res) => {
    // update a comment

    const { commentId } = req.params  // i will setup route which has placeholder for commentId
    const { content } = req.body  //here content means new content

    // const comment = await Comment.findById(commentId)
    if (!commentId || !content) {
        throw new ApiError(400, "Comment id or content not provided")
    }


    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(400, "Comment does not exist")
    }

    if (comment?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "Only owner can update the comments")
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content
            }
        },
        { new: true }
    )
    if (!updatedComment) {
        throw new ApiError(400, "Failed to update the comment")
    }

    return res
        .status(201)
        .json(
            new ApiResponse(201, updatedComment, "Comment updated sccessfully")
        )
})

const deleteComment = asyncHandler(async (req, res) => {

    //  delete a comment

    const { commentId } = req.params

    if (!commentId) {
        throw new ApiError(400, "Comment id is not provided")
    }

    const comment = await Comment.findById(commentId)



    if (!comment) {
        throw new ApiError(400, "Comment not found")
    }

    if (comment?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError("Only owner can delete the comment")
    }


    const isCommentDeleted = await Comment.findByIdAndDelete(commentId)
    if (!isCommentDeleted) {
        throw new ApiError(400, "Commment cannot be deleted")
    }

    //also delete the like associated with this comment
    await Like.deleteMany({
        comment: commentId,
        likedBy: req.user
    })

    return res
        .status(201)
        .json(
            new ApiResponse(201, { commentId }, "Comment deleted successfully")
        )
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}