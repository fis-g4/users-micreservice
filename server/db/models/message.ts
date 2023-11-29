import mongoose, { ObjectId } from 'mongoose'

const { Schema } = mongoose

interface IMessage{
    _id?: ObjectId;
    subject: string;
    message: string;
    sender: string;
    receivers: Array<string>;
    date: Date;
    has_been_opened: Array<Boolean>;
    deleted_by_sender: Boolean;
    deleted_by_receiver: Array<Boolean>;
}

interface MessageDoc extends mongoose.Document {
    _id?: ObjectId;
    subject: string;
    message: string;
    sender: string;
    receivers: Array<string>;
    date: Date;
    has_been_opened: Array<Boolean>;
    deleted_by_sender: Boolean;
    deleted_by_receiver: Array<Boolean>;
}

interface MessageModelInterface extends mongoose.Model<MessageDoc> {
    build(attr: IMessage): MessageDoc;
}

const messageSchema = new Schema({
    subject: {
        type: String,
        required: true,
        minLength: 1,
        maxLength: 100,
        trim: true
    },
    message: {
        type: String,
        required: true,
        minLength: 1,
        maxLength: 1000,
        trim: true
    },
    sender: {
        type: String,
        required: true,
        minLength: 1,
    },
    receivers: {
        type: Array<String>(),
        required: true,
        minLength: 1,
        validate: (a: Array<String>) => a.length > 0 && a.every((n: String) => n.length>0)
    },
    date: {
        type: Date,
        required: true,
        default: Date.now,
        validate: (v: Date) => v.getTime() <= Date.now()
    },
    has_been_opened: {
        type: Array<Boolean>,
        required: true,
        validate: (a: Array<Boolean>) => a.length > 0
    },
    deleted_by_sender: {
        type: Boolean,
        required: true,
        default: false
    },
    deleted_by_receiver: {
        type: Array<Boolean>,
        required: true,
        validate: (a: Array<Boolean>) => a.length > 0
    }
})

messageSchema.statics.build = (message: IMessage) => {
    return new Message(message)
}

const Message = mongoose.model<MessageDoc, MessageModelInterface>('Message', messageSchema)

export { Message, IMessage }