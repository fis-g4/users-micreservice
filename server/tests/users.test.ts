import supertest from 'supertest'
import crypto from 'crypto'
import request from 'supertest'
import { PlanType } from '../db/models/user'
import { userErrors } from '../utils/errorMessages/users'

const BASE_URL = process.env.TESTING_API_BASE_URL || 'http://localhost:8000'

const testUrls = {
    login: '/users/login',
    newUser: '/users/new',
    usersUpdate: '/users/update',
    usersMe: '/users/me',
}

describe(`POST ${testUrls.newUser}`, () => {
    const testUser = {
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser',
        password: 'testpassword',
        email: 'testemail@example.com',
        plan: PlanType.FREE,
    }

    let token: string = "";

    afterAll(async () => {
        const response = await request(BASE_URL).delete(testUrls.usersMe).set('Authorization', `Bearer ${token}`)
        expect(response.statusCode).toBe(200)
    })

    it('Should return 201', async () => {
        const response = await request(BASE_URL).post(testUrls.newUser).send(testUser)
        expect(response.statusCode).toBe(201)
        token = response.body.jwtToken
    })

    it('Should return 400, with short firstName error', async () => {
        let testUserShortFirstName = {...testUser, firstName: 'T'}
        const response = await request(BASE_URL).post(testUrls.newUser).send(testUserShortFirstName)
        expect(response.statusCode).toBe(400)
        expect(response.text).toBe(userErrors.firstNameError)
    })

    it('Should return 400, with long firstName error', async () => {
        let testUserLongFirstName = {...testUser, firstName: 'ThisIsAFirstNameThatExtentTheLimitImposedByTheSystem'.repeat(41)}
        const response = await request(BASE_URL).post(testUrls.newUser).send(testUserLongFirstName)
        expect(response.statusCode).toBe(400)
        expect(response.text).toBe(userErrors.firstNameError)
    })

    it('Should return 400, with short lastName error', async () => {
        let testUserShortLastName = {...testUser, lastName: 'T'}
        const response = await request(BASE_URL).post(testUrls.newUser).send(testUserShortLastName)
        expect(response.statusCode).toBe(400)
        expect(response.text).toBe(userErrors.lastNameError)
    })

    it('Should return 400, with long lastName error', async () => {
        let testUserLongLastName = {...testUser, lastName: 'ThisIsALastNameThatExtentTheLimitImposedByTheSystem'.repeat(41)}
        const response = await request(BASE_URL).post(testUrls.newUser).send(testUserLongLastName)
        expect(response.statusCode).toBe(400)
        expect(response.text).toBe(userErrors.lastNameError)
    })

    it('Should return 400, with short username error', async () => {
        let testUserShortUsername = {...testUser, username: 'T'}
        const response = await request(BASE_URL).post(testUrls.newUser).send(testUserShortUsername)
        expect(response.statusCode).toBe(400)
        expect(response.text).toBe(userErrors.usernameError)
    })

    it('Should return 400, with long username error', async () => {
        let testUserLongUsername = {...testUser, username: 'ThisIsAUsernameThatExtentTheLimitImposedByTheSystem'.repeat(41)}
        const response = await request(BASE_URL).post(testUrls.newUser).send(testUserLongUsername)
        expect(response.statusCode).toBe(400)
        expect(response.text).toBe(userErrors.usernameError)
    })

    it('Should return 400, with invalid email format error', async () => {
        let testUserInvalidEmail = {...testUser, email: 'invalidemail'}
        const response = await request(BASE_URL).post(testUrls.newUser).send(testUserInvalidEmail)
        expect(response.statusCode).toBe(400)
        expect(response.text).toBe(userErrors.invalidEmailFormatError)
    })

    it('Should return 400, with existing username error', async () => {
        const response = await request(BASE_URL).post(testUrls.newUser).send(testUser)
        expect(response.statusCode).toBe(400)
        expect(response.text).toBe(userErrors.existingUsernameError)
    })

    it('Should return 400, with existing username error', async () => {
        let testUserExistingUsername = {...testUser, username: testUser.username + "            "}
        const response = await request(BASE_URL).post(testUrls.newUser).send(testUserExistingUsername)
        expect(response.statusCode).toBe(400)
        expect(response.text).toBe(userErrors.existingUsernameError)
    })

    it('Should return 400, with existing email error', async () => {
        let testUserExistingUsername = {...testUser, username: "newUserName"}
        const response = await request(BASE_URL).post(testUrls.newUser).send(testUserExistingUsername)
        expect(response.statusCode).toBe(400)
        expect(response.text).toBe(userErrors.existingEmailError)
    })

    it('Should return 400, with invalid plan error', async () => {
        let testUserInvalidPlan = {...testUser, username: "newUserName", email: "newemail@example.com", plan: 'invalidplan'}
        const response = await request(BASE_URL).post(testUrls.newUser).send(testUserInvalidPlan)
        expect(response.statusCode).toBe(400)
        expect(response.text).toBe(userErrors.invalidPlanError)
    })

    // beforeAll(async () => {
    //     // set up the todo
    //     let res = await request(BASE_URL).post(testUrls.newUser).send(testUser)
    //     console.log(res.body);
        
    // })
    // afterAll(async () => {
    //     await request(BASE_URL).delete(`/todo/${newTodo.id}`)
    // })
    // it('should return 200', async () => {
    //     const response = await request(BASE_URL).get('/todos')
    //     expect(response.statusCode).toBe(200)
    //     expect(response.body.error).toBe(null)
    // })
    // it('should return todos', async () => {
    //     const response = await request(BASE_URL).get('/todos')
    //     expect(response.body.data.length >= 1).toBe(true)
    // })
})
