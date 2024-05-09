import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
// cookieParser is used to apply CRUD operation on the cookies of browser from the server

const app = express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials: true
}))


//data will come to backend in diff formats like json, forms, url, etc. so to handle it set the limit of json data
//whenever we are dealing with middlewares we use app.use intead of app.get
app.use(express.json({limit: "16kb"}))

//url has its own encoder which converts space to some special chars
app.use(express.urlencoded({extended: true, limit: "16kb"}))

//to store some data in the server like pdf then a public folder is public
app.use(express.static("public"))

app.use(cookieParser())





export { app }