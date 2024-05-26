//upload file from local server to the cloudinary server and also to remove the file from the local server
import {v2 as cloudinary} from "cloudinary"

//present in node file system
import fs from "fs"



// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View Credentials' below to copy your API secret
});

const uploadOnCloudinary = async(localFilePath) => {
    try{
        if(!localFilePath) return null
        //upload file from local server to the cloudinary server
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        //file has been uploaded successfully
        console.log("File is uploaded on cloudinary", response.url)
        fs.unlinkSync(localFilePath)
        return response

    }catch(error){
        //if there is any error in uploading file then just remove the file from the local server for safety purpose
        fs.unlinkSync(localFilePath)
        return null

    }
}


export {uploadOnCloudinary}