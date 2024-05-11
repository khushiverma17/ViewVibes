import mongoose, { Schema, mongo } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"
// mongooseAggregatePaginate is a plugin for Mongoose This plugin extends Mongoose's aggregate method to support pagination. use case for this plugin arises when you perform complex aggregations on MongoDB collections and need to paginate the results.



const videoSchema = new Schema(
    {
        videoFile:{
            type:String,
            required:true
        },
        thumbnail:{
            type:String,
            required:true
        },
        title:{
            type:String,
            required:true
        },
        description:{
            type:String,
            required:true
        },
        thumbnail:{
            type:duration,  //from cloudnary
            required:true
        },
        views:{
            type:Number,
            default: 0,
        },
        isPublished: {
            type: Boolean,
            default:true,
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }


    },
    {
        timestamps: true,
    }
)

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video", videoSchema)