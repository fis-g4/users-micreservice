import mongoose from 'mongoose'

const { Schema } = mongoose

interface IMessage{
    subject: string;
    messsage: string;
    sender: number;
    receivers: Array<number>;
    date: Date;
    has_been_opened: boolean;
    deleted_by_sender: boolean;
    deleted_by_receiver: boolean;
}

interface MessageDoc extends mongoose.Document {
    subject: string;
    messsage: string;
    sender: number;
    receivers: Array<number>;
    date: Date;
    has_been_opened: boolean;
    deleted_by_sender: boolean;
    deleted_by_receiver: boolean;
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
    messsage: {
        type: String,
        required: true,
        minLength: 1,
        maxLength: 1000,
        trim: true
    },
    sender: {
        type: Number,
        required: true,
        min: 0
    },
    receivers: {
        type: Array<number>(),
        required: true,
        validate: (a: Array<number>) => Array.isArray(a) && a.length > 0 && a.every((n: number) => n >= 0)
    },
    date: {
        type: Date,
        required: true,
        default: Date.now,
        validate: (v: Date) => v.getTime() <= Date.now()
    },
    has_been_opened: {
        type: Boolean,
        required: true,
        default: false
    },
    deleted_by_sender: {
        type: Boolean,
        required: true,
        default: false
    },
    deleted_by_receiver: {
        type: Boolean,
        required: true,
        default: false
    }
})

messageSchema.statics.build = (message: IMessage) => {
    return new Message(message)
}

const Message = mongoose.model<MessageDoc, MessageModelInterface>('Message', messageSchema)

export { Message }