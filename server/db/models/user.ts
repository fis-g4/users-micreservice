import mongoose from 'mongoose'

const { Schema } = mongoose

interface IUser{
    name: string;
    email: string;
    password: string;
}

interface UserDoc extends mongoose.Document {
    name: string;
    email: string;
    password: string;
}

interface UserModelInterface extends mongoose.Model<UserDoc> {
    build(attr: IUser): UserDoc;
}


const userSchema = new Schema({
    name: {
        type: String,
        //required: true,
    },
    email: {
        type: String,
        //required: true,
    },
    password: {
        type: String,
        //required: true,
    },
})

userSchema.statics.build = (user: IUser) => {
    return new User(user)
}

const User = mongoose.model<UserDoc, UserModelInterface>('User', userSchema)

export { User }