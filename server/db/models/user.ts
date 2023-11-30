import mongoose, { ObjectId } from 'mongoose'

const { Schema } = mongoose

enum PlanType{
    FREE = 'FREE',
    PREMIUM = 'PREMIUM',
    PRO = 'PRO'
}

interface IUser {
    _id?: ObjectId
    firstName: string
    lastName: string
    username: string
    password: string
    email: string
    plan: PlanType
}

interface UserDoc extends mongoose.Document {
    _id?: ObjectId
    firstName: string
    lastName: string
    username: string
    password: string
    email: string
    plan: PlanType
}

interface UserModelInterface extends mongoose.Model<UserDoc> {
    build(attr: IUser): UserDoc
}

const userSchema = new Schema(
    {
        firstName: {
            type: String,
            trim: true,
            //required: true,
        },
        lastName: {
            type: String,
            trim: true,
            //required: true,
        },
        username: {
            type: String,
            unique: true,
            trim: true,
            //required: true,
        },
        password: {
            type: String,
            trim: true,
            //required: true,
        },
        email: {
            type: String,
            unique: true,
            trim: true,
            //required: true,
        },
        plan: {
            type: String,
            enum: Object.values(PlanType),
            default: PlanType.FREE,
            trim: true,
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

export { User, IUser, PlanType }
