import express, { Request, Response } from 'express'
import { IUser, User } from '../db/models/user'
import { IMessage, Message } from '../db/models/message'
import { getPayloadFromToken } from '../utils/jwtUtils'
import { messagesErrors } from '../utils/errorMessages/messages'
import { SortOrder } from 'mongoose'

const router = express.Router()
const DEFAULT_LIMIT = 25;

router.post('/messages/new', async (req: Request, res: Response) => {
    const messageData: IMessage = req.body
    let decodedToken: IUser = getPayloadFromToken(req);
    const user = await User.findOne({ username: decodedToken.username });

    if (!user) {
        return res.status(404).send({error: messagesErrors.userDoesNotExistError})
    }

    if (!messageData) {
        return res.status(400).send({error: messagesErrors.emptyMessageError})
    }

    if (messageData?.date) {
        messageData.date = new Date(Date.now())
    }

    try{
      const message = Message.build(messageData)
      if (message.receivers.length !== message.has_been_opened.length || message.receivers.length !== message.deleted_by_receiver.length) {
          return res.status(400).send({error: messagesErrors.invalidMessageDataError})
      }
      if (message.receivers.indexOf(message.sender) !== -1) {
          return res.status(400).send({error: messagesErrors.invalidMessageDataError})
      }
      if (message.sender !== user.username) {
          return res.status(400).send({error: messagesErrors.invalidSenderError})
      }
      if (message.has_been_opened.includes(true) || message.deleted_by_receiver.includes(true) || message.deleted_by_sender) {
          return res.status(400).send({error: messagesErrors.invalidMessageDataError})
      }
      if (message.receivers.length !== new Set(message.receivers).size) {
          return res.status(400).send({error: messagesErrors.invalidMessageDataError})
      }
      await message.save()
    } catch (err) {
        return res.status(400).send({error: err ?? "There was an error creating the message"})
    }
    return res.status(201).json({ message: 'Message sent!' })
})

router.patch('/messages/:messageId/open', async (req: Request, res: Response) => {
    let decodedToken: IUser = getPayloadFromToken(req);
    const user = await User.findOne({ username: decodedToken.username });

    if (!user) {
        return res.status(404).send({error: messagesErrors.userDoesNotExistError})
    }

    Message.findById(req.params.messageId).then((message: IMessage | null) => {
        if (!message) {
            return res.status(404).send({error: messagesErrors.invalidMessageError})
        }
        if (message.receivers.indexOf(user.username) === -1) {
            return res.status(400).send({error: messagesErrors.invalidOpenError})
        }
        if (message.has_been_opened[message.receivers.indexOf(user.username)]) {
            return res.status(400).send({error: messagesErrors.invalidOpenError})
        }
        message.has_been_opened[message.receivers.indexOf(user.username)] = true;
        Message.updateOne({ _id: req.params.messageId }, message).then(() => {
            return res.status(200).json({ message: 'Message opened!' })
        }).catch((err) => {
            return res.status(400).send({error: err ?? "There was an error opening the message"})
        });
    }).catch((err) => {
      return res.status(400).send({error: err ?? "There was an error opening the message"})
    });
    
})

router.patch('/messages/:messageId', async (req: Request, res: Response) => {
    const messageData: IMessage = req.body
    let decodedToken: IUser = getPayloadFromToken(req);
    const user = await User.findOne({ username: decodedToken.username });

    if (!user) {
        return res.status(404).send({error: messagesErrors.userDoesNotExistError})
    }

    if (!messageData) {
        return res.status(400).send({error: messagesErrors.emptyMessageError})
    }

    Message.findById(req.params.messageId).then((message: IMessage | null) => {
        if (!message) {
            return res.status(404).send({error: messagesErrors.invalidMessageError})
        }
        if (message.sender !== user.username) {
            return res.status(400).send({error: messagesErrors.invalidUpdateError})
        }
        if (message.has_been_opened.includes(true) || message.deleted_by_receiver.includes(true)) {
            return res.status(400).send({error: messagesErrors.invalidUpdateError})
        }
        if (message.deleted_by_sender) {
            return res.status(400).send({error: messagesErrors.invalidUpdateError})
        }
        if (message.subject === messageData.subject && message.message === messageData.message) {
            return res.status(400).send({error: messagesErrors.noChangedDataError})
        }
        message.subject = messageData.subject;
        message.message = messageData.message;
        Message.updateOne({ _id: req.params.messageId }, message).then(() => {
            return res.status(200).json({ message: 'Message updated!' })
        }).catch((err) => {
            return res.status(400).send({error: err ?? "There was an error updating the message"})
        });
    }).catch((err) => {
      return res.status(400).send({error: err ?? "There was an error updating the message"})
    });
    
})

router.delete('/messages/:messageId', async (req: Request, res: Response) => {
    let decodedToken: IUser = getPayloadFromToken(req);
    const user = await User.findOne({ username: decodedToken.username });

    if (!user) {
        return res.status(404).send({error: messagesErrors.invalidDeleteError})
    }

    Message.findById(req.params.messageId).then((message: IMessage | null) => {
        if (!message) {
            return res.status(404).send({error: messagesErrors.invalidMessageError})
        }
        if (message.sender !== user.username && message.receivers.indexOf(user.username) === -1) {
            return res.status(400).send({error: messagesErrors.invalidDeleteError})
        }
        if (message.sender === user.username) {
            if (message.deleted_by_sender) {
                return res.status(400).send({error: messagesErrors.previousDeleteError})
            }
            message.deleted_by_sender = true;
        } else {
            if (message.deleted_by_receiver[message.receivers.indexOf(user.username)]) {
                return res.status(400).send({error: messagesErrors.previousDeleteError})
            }
            message.deleted_by_receiver[message.receivers.indexOf(user.username)] = true;
        }
        Message.updateOne({ _id: req.params.messageId }, message).then(() => {
            return res.status(200).json({ message: 'Message deleted!' })
        }).catch((err) => {
            return res.status(400).send({error: err ?? "There was an error deleting the message"})
        });
    }).catch((err) => {
      return res.status(400).send({error: err ?? "There was an error deleting the message"})
    });
    
})

router.get('/me/messages', async (req: Request, res: Response) => {
    let decodedToken: IUser = getPayloadFromToken(req);
    const user = await User.findOne({ username: decodedToken.username });

    if (!user) {
        return res.status(404).send({error: messagesErrors.userDoesNotExistError})
    }

    let filter = req.query.filter?req.query.filter.toString().trim().toUpperCase():null;
    let sort:SortOrder = req.query.sort?req.query.sort.toString().trim().toUpperCase()==="ASC"?1:-1:1;
    let offset = req.query.offset?parseInt(req.query.offset.toString().trim()):null;
    let limit = req.query.limit?parseInt(req.query.limit.toString().trim()):DEFAULT_LIMIT;
    let total = 0;

    if (limit && limit < 1) {
        limit = DEFAULT_LIMIT;
    }

    Message.find({ $or: [{ $and: [{ sender: user.username }, { deleted_by_sender: false}]}, { $and: [{ receivers: user.username }, { deleted_by_receiver: false } ]}] }).sort({date: sort}).then((messages: Array<IMessage>) => {
        messages = messages.filter(message => message.sender === user.username || (message.receivers.includes(user.username) && !message.deleted_by_receiver[message.receivers.indexOf(user.username)]))
        
        if (filter === "UNREAD") {
            messages = messages.filter(message => message.receivers.includes(user.username) && !message.has_been_opened[message.receivers.indexOf(user.username)])
        } else if (filter === "SENT") {
            messages = messages.filter(message => message.sender === user.username)
        } else if (filter === "RECEIVED") {
            messages = messages.filter(message => message.sender !== user.username)
        }

        total = messages.length;
        if (offset && offset < 0) {
            offset = null;
        } else if (offset && offset*limit > total) {
            return res.status(200).send({data: {messages: [], total: 0}})
        }

        if (offset) {
            let slice_limit = limit?limit+offset>total?total:limit+offset:total;
            messages = messages.slice(offset, slice_limit)
        } else if (limit) {
            messages = messages.slice(0, limit)
        }

        return res.status(200).json({ data: { messages: messages, total: total } })
    }).catch((err) => {
        return res.status(400).send({error: err ?? "There was an error getting the messages"})
    });
})

export default router
