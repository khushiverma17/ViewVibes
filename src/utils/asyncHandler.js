//in this app or any other, our app communicate with server very frequently so to not write the async funtion again and again we create a wrapper type of the function and export it
//two ways are there try catch and promises

//here requestHandler will be functions like login, register, fetchUsers
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).
        catch((error) => next(error))
    }
}

export {asyncHandler}


// const asyncHandler = () => {}
// const asyncHandler = (func) => {() => {}}
// const asyncHandler = (func) => () => {}
// const asyncHandler = (func) => async() => {}


// const asyncHandler = (fn) => async(req, res, next) => {
//     try{
//         await fn(req, res, next)
//     }catch(error){
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }