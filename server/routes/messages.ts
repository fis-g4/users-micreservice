import express, { Request, Response } from 'express'
import { IUser, User } from '../db/models/user'
import { IMessage, Message } from '../db/models/message'
import { getPayloadFromToken } from '../utils/jwtUtils'
import { messagesErrors } from '../utils/errorMessages/messages'
import { SortOrder } from 'mongoose'

const router = express.Router()
const DEFAULT_LIMIT = 25;

/**
 * @swagger
 * components:
 *   schemas:
 *     Message:
 *       type: object
 *       required:
 *         - subject
 *         - message
 *         - sender
 *         - receivers
 *         - has_been_opened
 *         - deleted_by_receiver
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the message
 *         subject:
 *           type: string
 *           description: The subject of your message
 *         message:
 *           type: string
 *           description: The text of your message
 *         sender:
 *           type: string
 *           description: The username of the sender
 *         receivers:
 *           type: array
 *           items:
 *             type: string
 *           description: The usernames of the receivers
 *         has_been_opened:
 *           type: array
 *           items:
 *             type: boolean
 *           description: Whether the receivers has opened the message
 *         deleted_by_sender:
 *           type: boolean
 *           description: Whether the sender has deleted the message from their inbox
 *         deleted_by_receiver:
 *           type: array
 *           items:
 *             type: boolean
 *           description: Whether the receivers has deleted the message from their inbox
 *         date:
 *           type: string
 *           format: date-time
 *           description: The date the message was added
 *       example:
 *         id: 5f748650b547644a7c8a6d0d
 *         subject: Hello!
 *         message: How are you?
 *         sender: user1
 *         receivers: [user2, user3]
 *         has_been_opened: [true, false]
 *         deleted_by_sender: false
 *         deleted_by_receiver: [false, false]
 *         date: 2023-12-04T00:00:00.000Z
 *     MessagesList:
 *       type: object
 *       required:
 *         - data
 *       properties:
 *         data:
 *           type: object
 *           required:
 *             - messages
 *             - total
 *           properties:
 *             messages:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Message'
 *             total:
 *               type: integer
 *               example: 10
 *     OK2XX:
 *       type: object
 *       required:
 *         - message
 *       properties:
 *         message: string
 *       example:
 *         message: The request was successful
 *     Error400:
 *       type: object
 *       required:
 *         - error
 *       properties:
 *         error: string
 *       example:
 *         error: Bad request
 *     Error401:
 *       type: object
 *       required:
 *         - error
 *       properties:
 *         error: string
 *       example:
 *         error: Unauthorized
 *     Error404:
 *       type: object
 *       required:
 *         - error
 *       properties:
 *         error: string
 *       example:
 *         error: Not found
 *     Error500:
 *       type: string
 *       example:
 *         Internal server error
 */

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: The messages managing API
 */

/**
 * @swagger
 * /messages/new:
 *   post:
 *     summary: Create a new message
 *     tags: [Messages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Message'
 *     responses:
 *       201:
 *         description: The message was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OK2XX'
 *       400:
 *         description: There was an error with the request
 *         content:
 *           application/json:
 *             schema:
 *              $ref: '#/components/schemas/Error400'
 *       404:
 *         description: The item was not found
 *         content:
 *           application/json:
 *             schema:
 *              $ref: '#/components/schemas/Error404'
 *       401:
 *         description: The request was not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error401'
 *       500:
 *         description: Some server error
 *         content:
 *           application/json:
 *             schema:
 *              $ref: '#/components/schemas/Error500'
 */
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
      if ((await User.find({ username: { $in: message.receivers } }).countDocuments()) !== message.receivers.length) {
          return res.status(404).send({error: messagesErrors.userDoesNotExistError})
      }
      await message.save()
    } catch (err) {
        return res.status(400).send({error: err ?? "There was an error creating the message"})
    }
    return res.status(201).json({ message: 'Message sent!' })
})

/**
 * @swagger
 * /messages/{messageId}/open:
 *   patch:
 *     summary: Checks a message as opened
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: The id of the message
 *     responses:
 *       200:
 *         description: The message was successfully checked as opened
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OK2XX'
 *       400:
 *         description: There was an error with the request
 *         content:
 *           application/json:
 *             schema:
 *              $ref: '#/components/schemas/Error400'
 *       401:
 *         description: The request was not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error401'
 *       404:
 *         description: The item was not found
 *         content:
 *           application/json:
 *             schema:
 *              $ref: '#/components/schemas/Error404'
 *       500:
 *         description: Some server error
 *         content:
 *           application/json:
 *             schema:
 *              $ref: '#/components/schemas/Error500'
 */

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

/**
 * @swagger
 * /messages/{messageId}:
 *   patch:
 *     summary: Enables to change the subject or the message of a message already sent
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: The id of the message
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Message'
 *     responses:
 *       200:
 *         description: The message was successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OK2XX'
 *       400:
 *         description: There was an error with the request
 *         content:
 *           application/json:
 *             schema:
 *              $ref: '#/components/schemas/Error400'
 *       401:
 *         description: The request was not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error401'
 *       404:
 *         description: The item was not found
 *         content:
 *           application/json:
 *             schema:
 *              $ref: '#/components/schemas/Error404'
 *       500:
 *         description: Some server error
 *         content:
 *           application/json:
 *             schema:
 *              $ref: '#/components/schemas/Error500'
 */

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

/**
 * @swagger
 * /messages/{messageId}:
 *   delete:
 *     summary: Checks a message as deleted
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: The id of the message
 *     responses:
 *       200:
 *         description: The message was successfully checked as deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessagesList'
 *       400:
 *         description: There was an error with the request
 *         content:
 *           application/json:
 *             schema:
 *              $ref: '#/components/schemas/Error400'
 *       401:
 *         description: The request was not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error401'
 *       404:
 *         description: The item was not found
 *         content:
 *           application/json:
 *             schema:
 *              $ref: '#/components/schemas/Error404'
 *       500:
 *         description: Some server error
 *         content:
 *           application/json:
 *             schema:
 *              $ref: '#/components/schemas/Error500'
 */

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

/**
 * @swagger
 * /messages/me?filter={filter}&sort={sort}&offset={offset}&limit={limit}:
 *   get:
 *     summary: Get all the messages of the user
 *     tags: [Messages]
 *     parameters:
 *       - in: query
 *         name: filter
 *         description: Filter the messages
 *         schema:
 *           type: string
 *           enum: [UNREAD, SENT, RECEIVED]
 *       - in: query
 *         name: sort
 *         description: Sort the messages
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *       - in: query
 *         name: offset
 *         description: The number of messages to skip
 *         schema:        
 *           type: integer
 *       - in: query
 *         name: limit
 *         description: The number of messages to return. (If not customized, the default value will be 25)
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: The messages were successfully retrieved. The total number of messages before applying the offset and the limit to the final list is also returned (it can be useful for pagination)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessagesList'
 *       400:
 *         description: There was an error with the request
 *         content:
 *           application/json:
 *             schema:
 *              $ref: '#/components/schemas/Error400'
 *       401:
 *         description: The request was not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error401'
 *       404:
 *         description: The item was not found
 *         content:
 *           application/json:
 *             schema:
 *              $ref: '#/components/schemas/Error404'
 *       500:
 *         description: Some server error
 *         content:
 *           application/json:
 *             schema:
 *              $ref: '#/components/schemas/Error500'
 */

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
