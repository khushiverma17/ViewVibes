import mongoose from "mongoose";
import {DB_NAME} from "./constants.js"

import express from "express"
import {app} from "./app.js"

import connectDB from "./db/index.js";

connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Server is running at PORT: ${process.env.PORT}`)
    })
    app.on("error", (error) => {
        console.log("ERROR: ", error)
        throw error
    })
})
.catch((err) => {
    console.log("MONGODB connection failed!!! ", err)
})












/*
const app = express()

;(async () => {
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error) => {
            console.log("ERROR: ", error)
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`)
        })
    }catch(error){
        console.log("ERROR: ", error)
        throw error
    }
})()

*/