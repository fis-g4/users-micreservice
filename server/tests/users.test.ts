import dotenv from "dotenv";
import request from 'supertest'
import { PlanType } from '../db/models/user'
import { userErrors } from '../utils/errorMessages/users'
import { jwtErrors } from '../utils/errorMessages/jwt';

dotenv.config();

const BASE_URL = process.env.TESTING_API_BASE_URL ?? '';

const testUrls = {
    login: '/users/login',
    newUser: '/users/new',
    usersUpdate: '/users/update',
    usersMe: '/users/me',
}

const TEST_USER = {
    firstName: 'Test',
    lastName: 'User',
    username: 'TEST_USER',
    password: 'testpassword',
    email: 'testemail@example.com',
    plan: PlanType.FREE,
}

// ---------------------------- GET MY DATA ----------------------------

describe(`GET ${testUrls.usersMe}`, () => {
    let token = "";

    beforeAll(async () => {
        const response = await request(BASE_URL).post(testUrls.newUser).send(TEST_USER)
        expect(response.statusCode).toBe(201)
        token = response.body.jwtToken
    })

    afterAll(async () => {
        const response = await request(BASE_URL).delete(testUrls.usersMe).set('Authorization', `Bearer ${token}`)
        expect(response.statusCode).toBe(200)
    })

    it('Should return 200', async () => {
        const response = await request(BASE_URL).get(testUrls.usersMe).set('Authorization', `Bearer ${token}`)
        expect(response.statusCode).toBe(200)
        expect(response.body.username).toBe(TEST_USER.username)
    })

    it('Should return 401, with invalid token error', async () => {
        const response = await request(BASE_URL).get(testUrls.usersMe).set('Authorization', `Bearer ${token}invalid`)
        expect(response.statusCode).toBe(401)
        expect(response.body.error).toBe(jwtErrors.invalidTokenError)
    })

    it('Should return 401, with no token error', async () => {
        const response = await request(BASE_URL).get(testUrls.usersMe)
        expect(response.statusCode).toBe(401)
        expect(response.body.error).toBe(jwtErrors.tokenNeededError)
    })
})

// ---------------------------- GET OTHERS DATA ----------------------------



// ---------------------------- NEW USER ----------------------------

describe(`POST ${testUrls.newUser}`, () => {

    let token: string = "";

    afterAll(async () => {
        const response = await request(BASE_URL).delete(testUrls.usersMe).set('Authorization', `Bearer ${token}`)
        expect(response.statusCode).toBe(200)
    })

    it('Should return 201', async () => {
        const response = await request(BASE_URL).post(testUrls.newUser).send(TEST_USER)
        expect(response.statusCode).toBe(201)
        token = response.body.jwtToken
    })

    it('Should return 400, with short firstName error', async () => {
        let TEST_USERShortFirstName = {...TEST_USER, firstName: 'T'}
        const response = await request(BASE_URL).post(testUrls.newUser).send(TEST_USERShortFirstName)
        expect(response.statusCode).toBe(400)
        expect(response.text).toBe(userErrors.firstNameError)
    })

    it('Should return 400, with long firstName error', async () => {
        let TEST_USERLongFirstName = {...TEST_USER, firstName: 'ThisIsAFirstNameThatExtentTheLimitImposedByTheSystem'.repeat(41)}
        const response = await request(BASE_URL).post(testUrls.newUser).send(TEST_USERLongFirstName)
        expect(response.statusCode).toBe(400)
        expect(response.text).toBe(userErrors.firstNameError)
    })

    it('Should return 400, with short lastName error', async () => {
        let TEST_USERShortLastName = {...TEST_USER, lastName: 'T'}
        const response = await request(BASE_URL).post(testUrls.newUser).send(TEST_USERShortLastName)
        expect(response.statusCode).toBe(400)
        expect(response.text).toBe(userErrors.lastNameError)
    })

    it('Should return 400, with long lastName error', async () => {
        let TEST_USERLongLastName = {...TEST_USER, lastName: 'ThisIsALastNameThatExtentTheLimitImposedByTheSystem'.repeat(41)}
        const response = await request(BASE_URL).post(testUrls.newUser).send(TEST_USERLongLastName)
        expect(response.statusCode).toBe(400)
        expect(response.text).toBe(userErrors.lastNameError)
    })

    it('Should return 400, with short username error', async () => {
        let TEST_USERShortUsername = {...TEST_USER, username: 'T'}
        const response = await request(BASE_URL).post(testUrls.newUser).send(TEST_USERShortUsername)
        expect(response.statusCode).toBe(400)
        expect(response.text).toBe(userErrors.usernameError)
    })

    it('Should return 400, with long username error', async () => {
        let TEST_USERLongUsername = {...TEST_USER, username: 'ThisIsAUsernameThatExtentTheLimitImposedByTheSystem'.repeat(41)}
        const response = await request(BASE_URL).post(testUrls.newUser).send(TEST_USERLongUsername)
        expect(response.statusCode).toBe(400)
        expect(response.text).toBe(userErrors.usernameError)
    })

    it('Should return 400, with invalid email format error', async () => {
        let TEST_USERInvalidEmail = {...TEST_USER, email: 'invalidemail'}
        const response = await request(BASE_URL).post(testUrls.newUser).send(TEST_USERInvalidEmail)
        expect(response.statusCode).toBe(400)
        expect(response.text).toBe(userErrors.invalidEmailFormatError)
    })

    it('Should return 400, with existing username error', async () => {
        const response = await request(BASE_URL).post(testUrls.newUser).send(TEST_USER)
        expect(response.statusCode).toBe(400)
        expect(response.text).toBe(userErrors.existingUsernameError)
    })

    it('Should return 400, with existing username error', async () => {
        let TEST_USERExistingUsername = {...TEST_USER, username: TEST_USER.username + "            "}
        const response = await request(BASE_URL).post(testUrls.newUser).send(TEST_USERExistingUsername)
        expect(response.statusCode).toBe(400)
        expect(response.text).toBe(userErrors.existingUsernameError)
    })

    it('Should return 400, with existing email error', async () => {
        let TEST_USERExistingUsername = {...TEST_USER, username: "newUserName"}
        const response = await request(BASE_URL).post(testUrls.newUser).send(TEST_USERExistingUsername)
        expect(response.statusCode).toBe(400)
        expect(response.text).toBe(userErrors.existingEmailError)
    })

    it('Should return 400, with invalid plan error', async () => {
        let TEST_USERInvalidPlan = {...TEST_USER, username: "newUserName", email: "newemail@example.com", plan: 'invalidplan'}
        const response = await request(BASE_URL).post(testUrls.newUser).send(TEST_USERInvalidPlan)
        expect(response.statusCode).toBe(400)
        expect(response.text).toBe(userErrors.invalidPlanError)
    })
})

// ---------------------------- LOGIN ----------------------------

describe(`POST ${testUrls.login}`, () => {
    
    let token = "";

    beforeAll(async () => {
        const response = await request(BASE_URL).post(testUrls.newUser).send(TEST_USER)
        expect(response.statusCode).toBe(201)
    })

    afterAll(async () => {
        const response = await request(BASE_URL).delete(testUrls.usersMe).set('Authorization', `Bearer ${token}`)
        expect(response.statusCode).toBe(200)
    })

    it('Should return 200', async () => {
        const response = await request(BASE_URL).post(testUrls.login).send({username: TEST_USER.username, password: TEST_USER.password})
        expect(response.statusCode).toBe(200)
        token = response.body.jwtToken
    })

    it('Should return 200, username has spaces', async () => {
        const response = await request(BASE_URL).post(testUrls.login).send({username: TEST_USER.username + "       ", password: TEST_USER.password})
        expect(response.statusCode).toBe(200)
    })

    it('Should return 400, with invalid username error', async () => {
        const response = await request(BASE_URL).post(testUrls.login).send({username: TEST_USER.username + "invalid", password: TEST_USER.password})
        expect(response.statusCode).toBe(400)
        expect(response.text).toBe(userErrors.invalidUsernameOrPasswordError)
    })

    it('Should return 400, with invalid password error', async () => {
        const response = await request(BASE_URL).post(testUrls.login).send({username: TEST_USER.username, password: TEST_USER.password + "invalid"})
        expect(response.statusCode).toBe(400)
        expect(response.text).toBe(userErrors.invalidUsernameOrPasswordError)
    })

    it('Should return 400, with invalid password error', async () => {
        const response = await request(BASE_URL).post(testUrls.login).send({username: TEST_USER.username, password: TEST_USER.password + "        "})
        expect(response.statusCode).toBe(400)
        expect(response.text).toBe(userErrors.invalidUsernameOrPasswordError)
    })
})