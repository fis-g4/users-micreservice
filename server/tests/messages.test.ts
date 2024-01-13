import dotenv from "dotenv";
import request from 'supertest'
import { PlanType, UserRole } from '../db/models/user'
import { jwtErrors } from '../utils/errorMessages/jwt';
import { messagesErrors } from '../utils/errorMessages/messages';
import mongoose from "mongoose";

dotenv.config();

const BASE_URL = process.env.TESTING_API_BASE_URL ?? '';

const TEST_URLS = {
    login: '/users/login',
    newUser: '/users/new',
    usersMe: '/users/me',
    newMessage: '/users/me/messages/new',
    messagesUpdate: '/users/me/messages/:messageId',
    messagesOpen: '/users/me/messages/:messageId/open',
    messagesMe: '/users/me/messages',
    messagesDelete: '/users/me/messages/:messageId'
}

const TEST_USER_1 = {
    firstName: 'Test',
    lastName: 'User 1',
    username: 'TEST_USER_1',
    password: 'testpassword',
    email: 'testemail1@example.com',
    plan: PlanType.BASIC,
    role: UserRole.USER,
}

const TEST_USER_2 = {
    firstName: 'Test',
    lastName: 'User 2',
    username: 'TEST_USER_2',
    password: 'testpassword',
    email: 'testemail2@example.com',
    plan: PlanType.BASIC,
    role: UserRole.USER,
}

// ---------------------------- GET MY DATA ----------------------------

// describe(`GET ${TEST_URLS.messagesMe}`, () => {
//     let token1 = "";
//     let token2 = "";

//     beforeAll(async() => {
//         const response = await request(BASE_URL).post(TEST_URLS.newUser).send(TEST_USER_1)
//         expect(response.statusCode).toBe(201)
//         token1 = response.body.data

//         const response2 = await request(BASE_URL).post(TEST_URLS.newUser).send(TEST_USER_2)
//         expect(response2.statusCode).toBe(201)
//         token2 = response2.body.data
        
//         let counter = 0

//         for (let i = 0; i < 150; i++) {
//             const response3 = await request(BASE_URL).post(TEST_URLS.newMessage).set('Authorization', `Bearer ${token1}`).send({
//                 sender: TEST_USER_1.username,
//                 receivers: [TEST_USER_2.username],
//                 subject: `Test subject ${counter}`,
//                 message: `Test message ${counter}`,
//                 has_been_opened: [false],
//                 deleted_by_sender: false,
//                 deleted_by_receiver: [false],
//             })
//             expect(response3.statusCode).toBe(201)
//             counter++
//             const response4 = await request(BASE_URL).post(TEST_URLS.newMessage).set('Authorization', `Bearer ${token2}`).send({
//                 sender: TEST_USER_2.username,
//                 receivers: [TEST_USER_1.username],
//                 subject: `Test subject ${counter}`,
//                 message: `Test message ${counter}`,
//                 has_been_opened: [false],
//                 deleted_by_sender: false,
//                 deleted_by_receiver: [false],
//             })
//             expect(response4.statusCode).toBe(201)
//             counter++
//         }
//     })

//     afterAll(async () => {
//         await mongoose
//         .connect(`${process.env.DB_URI ?? ''}`,
//         {
//             dbName: `${process.env.DB_TEST_NAME ?? ''}`,
//             user: `${process.env.DB_USER ?? ''}`,
//             pass: `${process.env.DB_PASS ?? ''}`,
//             authSource: `${process.env.AUTH_DB ?? ''}`,
//         })
//         .then(() => {
//             mongoose.connection.dropCollection('messages')
//         })
//         .catch((err) => {
//             console.log(err)
//         })
//         const response = await request(BASE_URL).delete(TEST_URLS.usersMe).set('Authorization', `Bearer ${token1}`)
//         expect(response.statusCode).toBe(200)
//         const response2 = await request(BASE_URL).delete(TEST_URLS.usersMe).set('Authorization', `Bearer ${token2}`)
//         expect(response2.statusCode).toBe(200)
//     })

//     it('Should return 200', async () => {
//         const response = await request(BASE_URL).get(TEST_URLS.messagesMe).set('Authorization', `Bearer ${token1}`)
//         expect(response.statusCode).toBe(200)
//         expect(response.body.data.messages.length).toBe(25)
//     })

//     it('Should return 200, with limit', async () => {
//         const response = await request(BASE_URL).get(TEST_URLS.messagesMe).set('Authorization', `Bearer ${token1}`).query({limit: 50})
//         expect(response.statusCode).toBe(200)
//         expect(response.body.data.messages.length).toBe(50)
//     })

//     it('Should return 200, with bad limit', async () => {
//         const response = await request(BASE_URL).get(TEST_URLS.messagesMe).set('Authorization', `Bearer ${token1}`).query({limit: -1})
//         expect(response.statusCode).toBe(200)
//         expect(response.body.data.messages.length).toBe(25)
//     })

//     it('Should return 200, with high limit', async () => {
//         const response = await request(BASE_URL).get(TEST_URLS.messagesMe).set('Authorization', `Bearer ${token1}`).query({limit: 350})
//         expect(response.statusCode).toBe(200)
//         expect(response.body.data.messages.length).toBe(300)
//     })

//     it('Should return 200, with offset and limit', async () => {
//         const response = await request(BASE_URL).get(TEST_URLS.messagesMe).set('Authorization', `Bearer ${token1}`).query({offset: 5, limit: 10})
//         expect(response.statusCode).toBe(200)
//         expect(response.body.data.messages.length).toBe(10)
//     })

//     it('Should return 200, with offset', async () => {
//         const response = await request(BASE_URL).get(TEST_URLS.messagesMe).set('Authorization', `Bearer ${token1}`).query({offset: 2})
//         expect(response.statusCode).toBe(200)
//         expect(response.body.data.messages.length).toBe(25)
//     })

//     it('Should return 200, with filter', async () => {
//         const response = await request(BASE_URL).get(TEST_URLS.messagesMe).set('Authorization', `Bearer ${token1}`).query({filter: 'UNREAD', limit: 300})
//         expect(response.statusCode).toBe(200)
//         expect(response.body.data.messages.length).toBe(150)
//     })

//     it('Should return 200, with filter', async () => {
//         const response = await request(BASE_URL).get(TEST_URLS.messagesMe).set('Authorization', `Bearer ${token1}`).query({filter: 'SENT', limit: 300})
//         expect(response.statusCode).toBe(200)
//         expect(response.body.data.messages.length).toBe(150)
//     })

//     it('Should return 200, with filter', async () => {
//         const response = await request(BASE_URL).get(TEST_URLS.messagesMe).set('Authorization', `Bearer ${token1}`).query({filter: 'RECEIVED', limit: 300})
//         expect(response.statusCode).toBe(200)
//         expect(response.body.data.messages.length).toBe(150)
//     })

//     it('Should return 200, with sort', async () => {
//         const response = await request(BASE_URL).get(TEST_URLS.messagesMe).set('Authorization', `Bearer ${token1}`).query({sort: 'ASC', limit: 300})
//         expect(response.statusCode).toBe(200)
//         expect(response.body.data.messages.length).toBe(300)
//     })

//     it('Should return 200, with sort', async () => {
//         const response = await request(BASE_URL).get(TEST_URLS.messagesMe).set('Authorization', `Bearer ${token1}`).query({sort: 'DESC', limit: 300})
//         expect(response.statusCode).toBe(200)
//         expect(response.body.data.messages.length).toBe(300)
//     })

//     it('Should return 200, with bad offset', async () => {
//         const response = await request(BASE_URL).get(TEST_URLS.messagesMe).set('Authorization', `Bearer ${token1}`).query({offset: 1000})
//         expect(response.statusCode).toBe(200)
//         expect(response.body.data.messages.length).toBe(0)
//     })

//     it('Should return 200, with bad offset', async () => {
//         const response = await request(BASE_URL).get(TEST_URLS.messagesMe).set('Authorization', `Bearer ${token1}`).query({offset: -1, limit: 300})
//         expect(response.statusCode).toBe(200)
//         expect(response.body.data.messages.length).toBe(300)
//     })

//     it('Should return 401, with invalid token error', async () => {
//         const response = await request(BASE_URL).get(TEST_URLS.messagesMe).set('Authorization', `Bearer ${token1}invalid`)
//         expect(response.statusCode).toBe(401)
//         expect(response.body.error).toBe(jwtErrors.invalidTokenError)
//     })

//     it('Should return 401, with no token error', async () => {
//         const response = await request(BASE_URL).get(TEST_URLS.messagesMe)
//         expect(response.statusCode).toBe(401)
//         expect(response.body.error).toBe(jwtErrors.tokenNeededError)
//     })
// })

// ---------------------------- POST NEW MESSAGE ----------------------------
describe(`POST ${TEST_URLS.newMessage}`, () => {
    let token1 = "";
    let token2 = "";

    beforeAll(async() => {
        const response = await request(BASE_URL).post(TEST_URLS.newUser).send(TEST_USER_1)
        expect(response.statusCode).toBe(201)
        token1 = response.body.data.token

        const response2 = await request(BASE_URL).post(TEST_URLS.newUser).send(TEST_USER_2)
        expect(response2.statusCode).toBe(201)
        token2 = response2.body.data.token
    })

    afterAll(async () => {
        await mongoose
        .connect(`${process.env.DB_URI ?? ''}`,
        {
            dbName: `${process.env.DB_TEST_NAME ?? ''}`,
            user: `${process.env.DB_USER ?? ''}`,
            pass: `${process.env.DB_PASS ?? ''}`,
            authSource: `${process.env.AUTH_DB ?? ''}`,
        })
        .then(() => {
            mongoose.connection.dropCollection('messages')
        })
        .catch((err) => {
            console.log(err)
        })
        const response = await request(BASE_URL).delete(TEST_URLS.usersMe).set('Authorization', `Bearer ${token1}`)
        expect(response.statusCode).toBe(200)
        const response2 = await request(BASE_URL).delete(TEST_URLS.usersMe).set('Authorization', `Bearer ${token2}`)
        expect(response2.statusCode).toBe(200)
    })

    it('Should return 201', async () => {
        const response = await request(BASE_URL).post(TEST_URLS.newMessage).set('Authorization', `Bearer ${token1}`).send({
            sender: TEST_USER_1.username,
            receivers: [TEST_USER_2.username],
            subject: 'Test subject',
            message: 'Test message',
            has_been_opened: [false],
            deleted_by_sender: false,
            deleted_by_receiver: [false],
        })
        expect(response.statusCode).toBe(201)
    })

    it('Should return 400, with no subject', async () => {
        const response = await request(BASE_URL).post(TEST_URLS.newMessage).set('Authorization', `Bearer ${token1}`).send({
            sender: TEST_USER_1.username,
            receivers: [TEST_USER_2.username],
            message: 'Test message',
        })
        expect(response.statusCode).toBe(400)
        expect(response.body.error.name).toBe('ValidationError')
    })

    it('Should return 400, with no message', async () => {
        const response = await request(BASE_URL).post(TEST_URLS.newMessage).set('Authorization', `Bearer ${token1}`).send({
            sender: TEST_USER_1.username,
            receivers: [TEST_USER_2.username],
            subject: 'Test subject',
        })
        expect(response.statusCode).toBe(400)
        expect(response.body.error.name).toBe('ValidationError')
    })

    it('Should return 400, with very long message', async () => {
        const response = await request(BASE_URL).post(TEST_URLS.newMessage).set('Authorization', `Bearer ${token1}`).send({
            sender: TEST_USER_1.username,
            receivers: [TEST_USER_2.username],
            subject: 'Test subject',
            message: 'a'.repeat(10501),
        })
        expect(response.statusCode).toBe(400)
        expect(response.body.error.name).toBe('ValidationError')
    })

    it('Should return 400, with very long subject', async () => {
        const response = await request(BASE_URL).post(TEST_URLS.newMessage).set('Authorization', `Bearer ${token1}`).send({
            sender: TEST_USER_1.username,
            receivers: [TEST_USER_2.username],
            subject: 'a'.repeat(129),
            message: 'Test message',
        })
        expect(response.statusCode).toBe(400)
        expect(response.body.error.name).toBe('ValidationError')
    })

    it('Should return 400, with no sender', async () => {
        const response = await request(BASE_URL).post(TEST_URLS.newMessage).set('Authorization', `Bearer ${token1}`).send({
            receivers: [TEST_USER_2.username],
            subject: 'Test subject',
            message: 'Test message',
        })
        expect(response.statusCode).toBe(400)
        expect(response.body.error).toBe(messagesErrors.invalidSenderError)
    })

    it('Should return 400, with no receivers', async () => {
        const response = await request(BASE_URL).post(TEST_URLS.newMessage).set('Authorization', `Bearer ${token1}`).send({
            sender: TEST_USER_1.username,
            subject: 'Test subject',
            message: 'Test message',
        })
        expect(response.statusCode).toBe(400)
        expect(response.body.error).toBe(messagesErrors.invalidMessageDataError)
    })

    it('Should return 201, with no deleted_by_sender', async () => {
        const response = await request(BASE_URL).post(TEST_URLS.newMessage).set('Authorization', `Bearer ${token1}`).send({
            sender: TEST_USER_1.username,
            receivers: [TEST_USER_2.username],
            subject: 'Test subject',
            message: 'Test message',
        })
        expect(response.statusCode).toBe(201)
    })

    it('Should return 201 with date', async () => {
        const response = await request(BASE_URL).post(TEST_URLS.newMessage).set('Authorization', `Bearer ${token1}`).send({
            sender: TEST_USER_1.username,
            receivers: [TEST_USER_2.username],
            subject: 'Test subject',
            message: 'Test message',
            date: Date.now(),
        })
        expect(response.statusCode).toBe(201)
    })

    it('Should return 201 with bad date', async () => {
        const response = await request(BASE_URL).post(TEST_URLS.newMessage).set('Authorization', `Bearer ${token1}`).send({
            sender: TEST_USER_1.username,
            receivers: [TEST_USER_2.username],
            subject: 'Test subject',
            message: 'Test message',
            date: Date.now() + 1000,
        })
        expect(response.statusCode).toBe(201)
    })
    
})

// ---------------------------- PATCH OPEN MESSAGE ----------------------------
describe(`PATCH ${TEST_URLS.messagesOpen}`, () => {
    let token1 = "";
    let token2 = "";
    let messageId = "";

    beforeAll(async() => {
        const response = await request(BASE_URL).post(TEST_URLS.newUser).send(TEST_USER_1)
        expect(response.statusCode).toBe(201)
        token1 = response.body.data.token

        const response2 = await request(BASE_URL).post(TEST_URLS.newUser).send(TEST_USER_2)
        expect(response2.statusCode).toBe(201)
        token2 = response2.body.data.token

        const response3 = await request(BASE_URL).post(TEST_URLS.newMessage).set('Authorization', `Bearer ${token1}`).send({
            sender: TEST_USER_1.username,
            receivers: [TEST_USER_2.username],
            subject: 'Test subject',
            message: 'Test message',
            has_been_opened: [false],
            deleted_by_sender: false,
            deleted_by_receiver: [false],
        })
        expect(response3.statusCode).toBe(201)

        const response4 = await request(BASE_URL).get(TEST_URLS.messagesMe).set('Authorization', `Bearer ${token1}`).send({})
        expect(response4.statusCode).toBe(200)
        messageId = response4.body.data.messages[0]._id
    })

    afterAll(async () => {
        await mongoose
        .connect(`${process.env.DB_URI ?? ''}`,
        {
            dbName: `${process.env.DB_TEST_NAME ?? ''}`,
            user: `${process.env.DB_USER ?? ''}`,
            pass: `${process.env.DB_PASS ?? ''}`,
            authSource: `${process.env.AUTH_DB ?? ''}`,
        })
        .then(() => {
            mongoose.connection.dropCollection('messages')
        })
        .catch((err) => {
            console.log(err)
        })
        const response = await request(BASE_URL).delete(TEST_URLS.usersMe).set('Authorization', `Bearer ${token1}`)
        expect(response.statusCode).toBe(200)
        const response2 = await request(BASE_URL).delete(TEST_URLS.usersMe).set('Authorization', `Bearer ${token2}`)
        expect(response2.statusCode).toBe(200)
    })

    it('Should return 200', async () => {
        const response = await request(BASE_URL).patch(TEST_URLS.messagesOpen.replace(':messageId', messageId)).set('Authorization', `Bearer ${token2}`)
        expect(response.statusCode).toBe(200)
    })

    it('Should return 400, with invalid messageId', async () => {
        const response = await request(BASE_URL).patch(TEST_URLS.messagesOpen.replace(':messageId', 'invalid')).set('Authorization', `Bearer ${token2}`)
        expect(response.statusCode).toBe(400)
        expect(response.body.error.value).toBe('invalid')
    })

    it('Should return 400, with already opened message', async () => {
        const response = await request(BASE_URL).patch(TEST_URLS.messagesOpen.replace(':messageId', messageId)).set('Authorization', `Bearer ${token2}`)
        expect(response.statusCode).toBe(400)
        expect(response.body.error).toBe(messagesErrors.invalidOpenError)
    })

    it('Should return 400, with sender token', async () => {
        const response = await request(BASE_URL).patch(TEST_URLS.messagesOpen.replace(':messageId', messageId)).set('Authorization', `Bearer ${token1}`)
        expect(response.statusCode).toBe(400)
        expect(response.body.error).toBe(messagesErrors.invalidOpenError)
    })

    it('Should return 400, with invalid token', async () => {
        const response = await request(BASE_URL).patch(TEST_URLS.messagesOpen.replace(':messageId', messageId)).set('Authorization', `Bearer ${token2}invalid`)
        expect(response.statusCode).toBe(401)
        expect(response.body.error).toBe(jwtErrors.invalidTokenError)
    })
})

// ---------------------------- PATCH UPDATE MESSAGE ----------------------------
describe(`PATCH ${TEST_URLS.messagesUpdate}`, () => {
    let token1 = "";
    let token2 = "";
    let messageId = "";

    beforeAll(async() => {
        const response = await request(BASE_URL).post(TEST_URLS.newUser).send(TEST_USER_1)
        expect(response.statusCode).toBe(201)
        token1 = response.body.data.token

        const response2 = await request(BASE_URL).post(TEST_URLS.newUser).send(TEST_USER_2)
        expect(response2.statusCode).toBe(201)
        token2 = response2.body.data.token

        const response3 = await request(BASE_URL).post(TEST_URLS.newMessage).set('Authorization', `Bearer ${token1}`).send({
            sender: TEST_USER_1.username,
            receivers: [TEST_USER_2.username],
            subject: 'Test subject',
            message: 'Test message',
            has_been_opened: [false],
            deleted_by_sender: false,
            deleted_by_receiver: [false],
        })
        expect(response3.statusCode).toBe(201)

        const response4 = await request(BASE_URL).get(TEST_URLS.messagesMe).set('Authorization', `Bearer ${token1}`).send({})
        expect(response4.statusCode).toBe(200)
        messageId = response4.body.data.messages[0]._id
    })

    afterAll(async () => {
        await mongoose
        .connect(`${process.env.DB_URI ?? ''}`,
        {
            dbName: `${process.env.DB_TEST_NAME ?? ''}`,
            user: `${process.env.DB_USER ?? ''}`,
            pass: `${process.env.DB_PASS ?? ''}`,
            authSource: `${process.env.AUTH_DB ?? ''}`,
        })
        .then(() => {
            mongoose.connection.dropCollection('messages')
        })
        .catch((err) => {
            console.log(err)
        })
        const response = await request(BASE_URL).delete(TEST_URLS.usersMe).set('Authorization', `Bearer ${token1}`)
        expect(response.statusCode).toBe(200)
        const response2 = await request(BASE_URL).delete(TEST_URLS.usersMe).set('Authorization', `Bearer ${token2}`)
        expect(response2.statusCode).toBe(200)
    })

    it('Should return 200 with new subject', async () => {
        const response = await request(BASE_URL).patch(TEST_URLS.messagesUpdate.replace(':messageId', messageId)).set('Authorization', `Bearer ${token1}`).send({
            subject: "New subject"})
        expect(response.statusCode).toBe(200)
    })

    it('Should return 200 with new message', async () => {
        const response = await request(BASE_URL).patch(TEST_URLS.messagesUpdate.replace(':messageId', messageId)).set('Authorization', `Bearer ${token1}`).send({
            message: "New message"})
        expect(response.statusCode).toBe(200)
    })

    it('Should return 200 with new subject and message', async () => {
        const response = await request(BASE_URL).patch(TEST_URLS.messagesUpdate.replace(':messageId', messageId)).set('Authorization', `Bearer ${token1}`).send({
            subject: "New subject 2",
            message: "New message 2"})
        expect(response.statusCode).toBe(200)
    })

    it('Should return 400 with already open message', async () => {
        const response = await request(BASE_URL).patch(TEST_URLS.messagesOpen.replace(':messageId', messageId)).set('Authorization', `Bearer ${token2}`).send()
        expect(response.statusCode).toBe(200)
        const response2 = await request(BASE_URL).patch(TEST_URLS.messagesUpdate.replace(':messageId', messageId)).set('Authorization', `Bearer ${token1}`).send({
            subject: "New subject"})
        expect(response2.statusCode).toBe(400)
        expect(response2.body.error).toBe(messagesErrors.invalidUpdateError)
    })

    it('Should return 400 with no subject or message', async () => {
        const response = await request(BASE_URL).patch(TEST_URLS.messagesUpdate.replace(':messageId', messageId)).set('Authorization', `Bearer ${token1}`).send({})
        expect(response.statusCode).toBe(400)
        expect(response.body.error).toBe(messagesErrors.invalidUpdateError)
    })

    it('Should return 400 with invalid messageId', async () => {
        const response = await request(BASE_URL).patch(TEST_URLS.messagesUpdate.replace(':messageId', 'invalid')).set('Authorization', `Bearer ${token1}`).send({
            subject: "New subject"})
        expect(response.statusCode).toBe(400)
        expect(response.body.error.value).toBe('invalid')
    })

    it('Should return 400 with invalid jwt', async () => {
        const response = await request(BASE_URL).patch(TEST_URLS.messagesUpdate.replace(':messageId', messageId)).set('Authorization', `Bearer ${token1}invalid`).send({
            subject: "New subject"})
        expect(response.statusCode).toBe(401)
        expect(response.body.error).toBe(jwtErrors.invalidTokenError)
    })
})

// ---------------------------- DELETE MESSAGE ----------------------------
describe(`DELETE ${TEST_URLS.messagesDelete}`, () => {
    let token1 = "";
    let token2 = "";
    let token3 = "";
    let messageId = "";

    beforeAll(async() => {
        const response = await request(BASE_URL).post(TEST_URLS.newUser).send(TEST_USER_1)
        expect(response.statusCode).toBe(201)
        token1 = response.body.data.token

        const response2 = await request(BASE_URL).post(TEST_URLS.newUser).send(TEST_USER_2)
        expect(response2.statusCode).toBe(201)
        token2 = response2.body.data.token

        const response3 = await request(BASE_URL).post(TEST_URLS.newUser).send({
            firstName: 'Test',
            lastName: 'User 3',
            username: 'TEST_USER_3',
            password: 'testpassword',
            email: 'test3@test.com',
            plan: PlanType.BASIC,
            role: UserRole.USER,
        })
        expect(response3.statusCode).toBe(201)
        token3 = response3.body.data.token

        const response4 = await request(BASE_URL).post(TEST_URLS.newMessage).set('Authorization', `Bearer ${token1}`).send({
            sender: TEST_USER_1.username,
            receivers: [TEST_USER_2.username],
            subject: 'Test subject',
            message: 'Test message',
            has_been_opened: [false],
            deleted_by_sender: false,
            deleted_by_receiver: [false],
        })
        expect(response4.statusCode).toBe(201)

        const response5 = await request(BASE_URL).get(TEST_URLS.messagesMe).set('Authorization', `Bearer ${token1}`).send({})
        expect(response5.statusCode).toBe(200)
        messageId = response5.body.data.messages[0]._id
    })

    afterAll(async () => {
        await mongoose
        .connect(`${process.env.DB_URI ?? ''}`,
        {
            dbName: `${process.env.DB_TEST_NAME ?? ''}`,
            user: `${process.env.DB_USER ?? ''}`,
            pass: `${process.env.DB_PASS ?? ''}`,
            authSource: `${process.env.AUTH_DB ?? ''}`,
        })
        .then(() => {
            mongoose.connection.dropCollection('messages')
        })
        .catch((err) => {
            console.log(err)
        })
        const response = await request(BASE_URL).delete(TEST_URLS.usersMe).set('Authorization', `Bearer ${token1}`)
        expect(response.statusCode).toBe(200)
        const response2 = await request(BASE_URL).delete(TEST_URLS.usersMe).set('Authorization', `Bearer ${token2}`)
        expect(response2.statusCode).toBe(200)
        const response3 = await request(BASE_URL).delete(TEST_URLS.usersMe).set('Authorization', `Bearer ${token3}`)
        expect(response3.statusCode).toBe(200)
    })

    it('Should return 200', async () => {
        const response = await request(BASE_URL).delete(TEST_URLS.messagesDelete.replace(':messageId', messageId)).set('Authorization', `Bearer ${token1}`)
        expect(response.statusCode).toBe(200)
    })

    it('Should return 400 with already deleted message', async () => {
        const response = await request(BASE_URL).delete(TEST_URLS.messagesDelete.replace(':messageId', messageId)).set('Authorization', `Bearer ${token1}`)
        expect(response.statusCode).toBe(400)
        expect(response.body.error).toBe(messagesErrors.previousDeleteError)
    })

    it('Should return 200 with another user (receiver)', async () => {
        const response = await request(BASE_URL).delete(TEST_URLS.messagesDelete.replace(':messageId', messageId)).set('Authorization', `Bearer ${token2}`)
        expect(response.statusCode).toBe(200)
    })

    it('Should return 400 with another user', async () => {
        const response = await request(BASE_URL).delete(TEST_URLS.messagesDelete.replace(':messageId', messageId)).set('Authorization', `Bearer ${token3}`)
        expect(response.statusCode).toBe(400)
        expect(response.body.error).toBe(messagesErrors.invalidDeleteError)
    })

    it('Should return 400 with invalid messageId', async () => {
        const response = await request(BASE_URL).delete(TEST_URLS.messagesDelete.replace(':messageId', 'invalid')).set('Authorization', `Bearer ${token1}`)
        expect(response.statusCode).toBe(400)
        expect(response.body.error.value).toBe('invalid')
    })

    it('Should return 400 with invalid jwt', async () => {
        const response = await request(BASE_URL).delete(TEST_URLS.messagesDelete.replace(':messageId', messageId)).set('Authorization', `Bearer ${token1}invalid`)
        expect(response.statusCode).toBe(401)
        expect(response.body.error).toBe(jwtErrors.invalidTokenError)
    })
})