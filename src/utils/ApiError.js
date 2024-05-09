//Error is the class provided by nodejs api error
class ApiError extends Error{
    constructor(
        statusCode,
        message= "Something went wrong",
        errors = [],
        stack = ""
    ){
        super(message)
        this.statusCode=statusCode
        this.data=null
        this.message=message
        this.success = false
        this.errors = errors

        //no need to understand
        if(stack){
            this.stack=stack
        }else{
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export {ApiError}