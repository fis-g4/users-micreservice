import amqplib, { Channel, Connection } from 'amqplib'
import axios from 'axios'
import { User } from '../db/models/user'

let channel: Channel, connection: Connection
const FIVE_HOURS = 60 * 60 * 5

async function sendMessage(
    dest: string,
    operationId: string,
    API_KEY: string,
    message?: string
) {
    try {
        await axios.post(
            `https://${process.env.API_DOMAIN}/v1/messages/${dest}`,
            {
                operationId,
                message,
            },
            {
                headers: {
                    'x-api-key': API_KEY,
                    'Content-Type': 'application/json',
                },
            }
        )
    } catch (error) {
        console.error(error)
    }
}

async function receiveMessages(queue: string) {
    try {
        const amqpServer = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBIT_SERVER_IP}:5672`
        connection = await amqplib.connect(amqpServer)
        channel = await connection.createChannel()
        await channel.consume(queue, (data) => {
            console.info(`Received ${Buffer.from(data!.content)}`)
            handleMessages(data!.content.toString())
            channel.ack(data!)
        })
    } catch (error) {
        console.error(error)
    }
}

async function handleMessages(message: string) {
    const jsonMessage = JSON.parse(message)
    const operationId = jsonMessage.operationId
    const messageContent = jsonMessage.message
    if (operationId === 'notificationNewPlanPayment'){
        const username = messageContent.username
        const plan = messageContent.plan
        
        User.findOne({username: username}).then((user) => {
            if (user){
                user.plan = plan
                user.save()
            } else {
                console.error('User does not exist!')
            }
        }).catch((err) => {
            console.error(err)
        });
    } else if (operationId === 'requestAppUsers'){
        const usernames = messageContent.usernames

        User.find({username: {$in: usernames}}).select("username profilePicture firstName lastName email plan").then((users) => {
            const data = {
                users: users
            }
            sendMessage('learning-microservice', 'responseAppUsers', process.env.API_KEY ?? '', JSON.stringify(data))
        }).catch((err) => {
            console.error(err)
        })
    }
}

export { receiveMessages, sendMessage }