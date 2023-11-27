import mongoose, { ObjectId } from 'mongoose'

const { Schema } = mongoose

interface IUser {
    _id?: ObjectId
    firstName: string
    lastName: string
    username: string
    password: string
    email: string
}

interface UserDoc extends mongoose.Document {
    _id?: ObjectId
    firstName: string
    lastName: string
    username: string
    password: string
    email: string
}

interface UserModelInterface extends mongoose.Model<UserDoc> {
    build(attr: IUser): UserDoc
}

const userSchema = new Schema(
    {
        firstName: {
            type: String,
            //required: true,
        },
        lastName: {
            type: String,
            //required: true,
        },
        username: {
            type: String,
            unique: true,
            //required: true,
        },
        password: {
            type: String,
            //required: true,
        },
        email: {
            type: String,
            unique: true,
            //required: true,
        },
    },
    {
        virtuals: {
            fullName: {
                get() {
                    return (this.firstName ?? '') + ' ' + (this.lastName ?? '')
                },
            },
        },
    }
)

userSchema.statics.build = (user: IUser) => {
    return new User(user)
}

const User = mongoose.model<UserDoc, UserModelInterface>('User', userSchema)

export { User, IUser }
