import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


//  toggle subscription
const toggleSubscription = asyncHandler(async (req, res) => {
    // const { channelId } = req.params
    const { channelId } = req.query
    if (!channelId) {
        throw new ApiError(400, "Channel id is not provided")
    }
    console.log("REQ", req.user._id);
    console.log("CHA ID IS ", channelId);
    const channelObjectId = new mongoose.Types.ObjectId(channelId);


    const isSubscribed = await Subscription.findOne({
        subscriber: req.user?._id,
        channel: channelObjectId
    })

    if (isSubscribed) {
        console.log("yes is subscribed");

        await Subscription.findByIdAndDelete(isSubscribed?._id)

        return res
            .status(200)
            .json(
                new ApiResponse(200, { subscribed: false }, "unsubscribed successfully")
            )
    }
    console.log("no is subscribed");

    await Subscription.create({
        subscriber: req.user?._id,
        channel: channelObjectId
    })

    return res
        .status(200)
        .json(
            new ApiResponse(200, { subscribed: true }, "subscribed successfully")
        )

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    let { channelId } = req.params

    if (!channelId) {
        throw new ApiError(2000, "Channel id is not provided")
    }
    channelId = new mongoose.Types.ObjectId(channelId)

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: channelId
            }
        },
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "subscriber",
                as: "subscriber",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribedToSubscriber"
                        }
                    },
                    {
                        $addFields: {
                            subscribedToSubscriber: {
                                $cond: {
                                    if: {
                                        $in: [
                                            channelId,
                                            "$subscribedToSubscriber.subscriber"
                                        ],
                                    },
                                    then: true,
                                    else: false
                                },
                            },
                            subscribersCount: {
                                $size: "$subscribedToSubscriber"
                            }
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$subscriber"
        },
        {
            $project: {
                _id: 0,
                subscriber: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                    subscribedToSubscriber: 1,
                    subscibersCount: 1
                }
            }
        }
    ])

    if (!subscribers) {
        throw new ApiError(400, "Unable to fetch subscribers")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, subscribers, "Subscribers fetched successfully")
        )


})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    console.log("ldjf", req.params);
    

    if (!subscriberId) {
        throw new ApiError(400, "Subscriber is not provided")
    }

    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "channel",
                as: "subscribedChannel",
                pipeline: [
                    {
                        $lookup: {
                            from: "videos",
                            localField: "_id",
                            foreignField: "owner",
                            as: "videos"
                        }
                    },
                    {
                        $addFields: {
                            latestVideo: {
                                $last: "$videos"
                            }
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$subscribedChannel"
        },
        {
            $project: {
                _id: 1,
                subscribedChannel: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                    latestVideo: {
                        _id: 1,
                        videoFile: 1,
                        thumbnail: 1,
                        owner: 1,
                        title: 1,
                        description: 1,
                        duration: 1,
                        createdAt: 1,
                        views: 1
                    }
                }
            }
        }
    ])

    if (!subscribedChannels) {
        throw new ApiError(400, "Unable to fetch subscribed channels")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, subscribedChannels, "Subscribed channels fetched successfully")
        )


})

const checkSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.query

    if(!channelId){
        throw new ApiError(400, "Channel id is not provided")
    }
    const channelObjectId = new mongoose.Types.ObjectId(channelId);

    const checkSubs = await Subscription.find({
        channel: channelObjectId,
        subscriber: req.user?._id
    })

    if(checkSubs.length > 0){
        return res
        .status(200)
        .json(
            new ApiResponse(200, {subscribed: true}, "user is subscribed to the channel")
        )
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, {subscribed: false}, "user is not subscribed to the channel")
    )

    
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
    checkSubscription
}