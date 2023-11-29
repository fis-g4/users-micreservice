import express, { Request, Response } from 'express'
import { IUser, User } from '../db/models/user'
import { IMessage, Message } from '../db/models/message'
import { getPayloadFromToken } from '../utils/jwtUtils'

const router = express.Router()

// MEJORAR MENSAJES VALIDACIONES Y CÓDIGOS DE ERROR (ESTANDARIZADOS)
// MEJORAR RESPUESTA CORRECTA DE CADA PETICIÓN (TENER EN CUENTA FRONTEND)
// APLICAR FILTRADO, PAGINACIÓN Y ORDENAMIENTO EN EL GET DE MESSAGES
// REVISAR VALIDACIÓN MODELOS DE DATOS

router.post('/messages/new', async (req: Request, res: Response) => {
    const messageData: IMessage = req.body
    let decodedToken: IUser = getPayloadFromToken(req);
    const user = await User.findOne({ username: decodedToken.username });

    if (!user) {
        return res.status(404).send('You cannot send this message!')
    }

    if (!messageData) {
        return res.status(400).send('No message data sent!')
    }

    try{
      const message = Message.build(messageData)
      if (message.receivers.length !== message.has_been_opened.length || message.receivers.length !== message.deleted_by_receiver.length) {
          return res.status(400).send('Invalid message data!')
      }
      if (message.receivers.indexOf(message.sender) !== -1) {
          return res.status(400).send('Invalid message data!')
      }
      if (message.sender !== user.id) {
          return res.status(400).send('You cannot send this message!')
      }
      if (message.has_been_opened.includes(true) || message.deleted_by_receiver.includes(true) || message.deleted_by_sender) {
          return res.status(400).send('Invalid message data!')
      }
      if (message.receivers.length !== new Set(message.receivers).size) {
          return res.status(400).send('Invalid message data!')
      }
      await message.save()
    } catch (err) {
      return res.status(400).send(err)
    }
    return res.status(201).json({ message: 'Message sent!' })
})

router.patch('/messages/:messageId/open', async (req: Request, res: Response) => {
    let decodedToken: IUser = getPayloadFromToken(req);
    const user = await User.findOne({ username: decodedToken.username });

    if (!user) {
        return res.status(404).send('You cannot open this message!')
    }

    Message.findById(req.params.messageId).then((message: IMessage | null) => {
        if (!message) {
            return res.status(404).send('Message does not exist!')
        }
        if (message.receivers.indexOf(user.id) === -1) {
            return res.status(400).send('You cannot open this message!')
        }
        if (message.has_been_opened[message.receivers.indexOf(user.id)]) {
            return res.status(400).send('You cannot open this message!')
        }
        message.has_been_opened[message.receivers.indexOf(user.id)] = true;
        Message.updateOne({ _id: req.params.messageId }, message).then(() => {
            return res.status(200).json({ message: 'Message opened!' })
        }).catch((err) => {
            return res.status(400).send(err)
        });
    }).catch((err) => {
      return res.status(400).send(err)
    });
    
})

router.patch('/messages/:messageId', async (req: Request, res: Response) => {
    const messageData: IMessage = req.body
    let decodedToken: IUser = getPayloadFromToken(req);
    const user = await User.findOne({ username: decodedToken.username });

    if (!user) {
        return res.status(404).send('You cannot update this message!')
    }

    if (!messageData) {
        return res.status(400).send('No message data sent!')
    }

    Message.findById(req.params.messageId).then((message: IMessage | null) => {
        if (!message) {
            return res.status(404).send('Message does not exist!')
        }
        if (message.sender !== user.id) {
            return res.status(400).send('You cannot update this message!')
        }
        if (message.has_been_opened.includes(true) || message.deleted_by_receiver.includes(true)) {
            return res.status(400).send('You cannot update this message!')
        }
        if (message.deleted_by_sender) {
            return res.status(400).send('You cannot update this message!')
        }
        if (message.subject === messageData.subject && message.message === messageData.message) {
            return res.status(400).send('Message has not been changed!')
        }
        message.subject = messageData.subject;
        message.message = messageData.message;
        Message.updateOne({ _id: req.params.messageId }, message).then(() => {
            return res.status(200).json({ message: 'Message updated!' })
        }).catch((err) => {
            return res.status(400).send(err)
        });
    }).catch((err) => {
      return res.status(400).send(err)
    });
    
})

router.delete('/messages/:messageId', async (req: Request, res: Response) => {
    let decodedToken: IUser = getPayloadFromToken(req);
    const user = await User.findOne({ username: decodedToken.username });

    if (!user) {
        return res.status(404).send('You cannot delete this message!')
    }

    Message.findById(req.params.messageId).then((message: IMessage | null) => {
        if (!message) {
            return res.status(404).send('Message does not exist!')
        }
        if (message.sender !== user.id && message.receivers.indexOf(user.id) === -1) {
            return res.status(400).send('You cannot delete this message!')
        }
        if (message.sender === user.id) {
            if (message.deleted_by_sender) {
                return res.status(400).send('The message was already deleted!')
            }
            message.deleted_by_sender = true;
        } else {
            if (message.deleted_by_receiver[message.receivers.indexOf(user.id)]) {
                return res.status(400).send('The message was already deleted!')
            }
            message.deleted_by_receiver[message.receivers.indexOf(user.id)] = true;
        }
        Message.updateOne({ _id: req.params.messageId }, message).then(() => {
            return res.status(200).json({ message: 'Message deleted!' })
        }).catch((err) => {
            return res.status(400).send(err)
        });
    }).catch((err) => {
      return res.status(400).send(err)
    });
    
})

router.get('/me/messages', async (req: Request, res: Response) => {
    let decodedToken: IUser = getPayloadFromToken(req);
    const user = await User.findOne({ username: decodedToken.username });

    if (!user) {
        return res.status(404).send('User does not exist!')
    }

    Message.find({ $or: [{ $and: [{ sender: user.id }, { deleted_by_sender: false}]}, { receivers: user.id }] }).then((messages: Array<IMessage>) => {
        messages = messages.filter(message => message.sender === user.id || (message.receivers.includes(user.id) && !message.deleted_by_receiver[message.receivers.indexOf(user.id)]))
        return res.status(200).json(messages)
    }).catch((err) => {
        return res.status(400).send(err)
    });
})

export default router
