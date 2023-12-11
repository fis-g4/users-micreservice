import dotenv from "dotenv";
import request from 'supertest'
import { PlanType, UserRole } from '../db/models/user'
import { userErrors } from '../utils/errorMessages/users'
import { jwtErrors } from '../utils/errorMessages/jwt';

dotenv.config();

const BASE_URL = process.env.TESTING_API_BASE_URL ?? '';

const TEST_URLS = {
    login: '/users/login',
    newUser: '/users/new',
    usersUpdate: '/users/:username',
    usersMe: '/users/me',
    users: '/users/:username'
}

const TEST_USER = {
    firstName: 'Test',
    lastName: 'User',
    username: 'TEST_USER',
    password: 'testpassword',
    email: 'testemail@example.com',
    plan: PlanType.FREE,
    role: UserRole.USER,
}

const ADMIN_USER_CREDENTIALS = {
    username: process.env.ADMIN_USERNAME ?? '',
    password: process.env.ADMIN_PASSWORD ?? ''
}

const USERS_TO_GET_DATA_FROM = {
    firstUser: {
        username: "johnDoe", 
        email: "juan@example.com"
    },
    secondUser: {
        username: "mariaDoe", 
        email: "maria@example.com"
    }
}

// ---------------------------- GET MY DATA ----------------------------

describe(`GET ${TEST_URLS.usersMe}`, () => {
    let token = "";

    beforeAll(async () => {
        const response = await request(BASE_URL).post(TEST_URLS.newUser).send(TEST_USER)
        expect(response.statusCode).toBe(201)
        token = response.body.data
    })

    afterAll(async () => {
        const response = await request(BASE_URL).delete(TEST_URLS.usersMe).set('Authorization', `Bearer ${token}`)
        expect(response.statusCode).toBe(200)
    })

    it('Should return 200', async () => {
        const response = await request(BASE_URL).get(TEST_URLS.usersMe).set('Authorization', `Bearer ${token}`)
        expect(response.statusCode).toBe(200)
        expect(response.body.data.username).toBe(TEST_USER.username)
    })

    it('Should return 401, with invalid token error', async () => {
        const response = await request(BASE_URL).get(TEST_URLS.usersMe).set('Authorization', `Bearer ${token}invalid`)
        expect(response.statusCode).toBe(401)
        expect(response.body.error).toBe(jwtErrors.invalidTokenError)
    })

    it('Should return 401, with no token error', async () => {
        const response = await request(BASE_URL).get(TEST_URLS.usersMe)
        expect(response.statusCode).toBe(401)
        expect(response.body.error).toBe(jwtErrors.tokenNeededError)
    })
})

// ---------------------------- GET OTHERS DATA ----------------------------

describe(`GET ${TEST_URLS.users}`, () => {

    let token = "";

    beforeAll(async () => {
        const response = await request(BASE_URL).post(TEST_URLS.newUser).send(TEST_USER)
        expect(response.statusCode).toBe(201)
        token = response.body.data
    })

    afterAll(async () => {
        const response = await request(BASE_URL).delete(TEST_URLS.usersMe).set('Authorization', `Bearer ${token}`)
        expect(response.statusCode).toBe(200)
    })

    it('Should return 200', async () => {
        const response = await request(BASE_URL).get(TEST_URLS.users.replace(':username', USERS_TO_GET_DATA_FROM.firstUser.username)).set('Authorization', `Bearer ${token}`)
        expect(response.statusCode).toBe(200)
        expect(response.body.data.username).toBe(USERS_TO_GET_DATA_FROM.firstUser.username)
    })

    it('Should return 200', async () => {
        const response = await request(BASE_URL).get(TEST_URLS.users.replace(':username', USERS_TO_GET_DATA_FROM.secondUser.username)).set('Authorization', `Bearer ${token}`)
        expect(response.statusCode).toBe(200)
        expect(response.body.data.username).toBe(USERS_TO_GET_DATA_FROM.secondUser.username)
    })

    it('Should return 404, with invalid username error', async () => {
        const response = await request(BASE_URL).get(TEST_URLS.users.replace(':username', USERS_TO_GET_DATA_FROM.firstUser.username + "invalid")).set('Authorization', `Bearer ${token}`)
        expect(response.statusCode).toBe(404)
        expect(response.body.error).toBe(userErrors.userNotExistError)
    })

    it('Should return 401, with invalid token error', async () => {
        const response = await request(BASE_URL).get(TEST_URLS.users.replace(':username', USERS_TO_GET_DATA_FROM.firstUser.username)).set('Authorization', `Bearer ${token}invalid`)
        expect(response.statusCode).toBe(401)
        expect(response.body.error).toBe(jwtErrors.invalidTokenError)
    })

    it('Should return 401, with no token error', async () => {
        const response = await request(BASE_URL).get(TEST_URLS.users.replace(':username', USERS_TO_GET_DATA_FROM.firstUser.username))
        expect(response.statusCode).toBe(401)
        expect(response.body.error).toBe(jwtErrors.tokenNeededError)
    })
})

// ---------------------------- NEW USER ----------------------------

describe(`POST ${TEST_URLS.newUser}`, () => {

    let token: string = "";

    afterAll(async () => {
        const response = await request(BASE_URL).delete(TEST_URLS.usersMe).set('Authorization', `Bearer ${token}`)
        expect(response.statusCode).toBe(200)
    })

    it('Should return 201', async () => {
        const response = await request(BASE_URL).post(TEST_URLS.newUser).send(TEST_USER)
        expect(response.statusCode).toBe(201)
        token = response.body.data
    })

    it('Should return 201 | User with role USER althought ADMIN role is passed', async () => {
        let testUserWithAdminRole = {...TEST_USER, username: TEST_USER.username+"new", email: TEST_USER.email+"new", role: UserRole.ADMIN}
        let testToken = ""
        const response = await request(BASE_URL).post(TEST_URLS.newUser).send(testUserWithAdminRole)
        expect(response.statusCode).toBe(201)
        testToken = response.body.data
        const responseCreatedUser = await request(BASE_URL).get(TEST_URLS.usersMe).send(testUserWithAdminRole).set('Authorization', `Bearer ${testToken}`)
        expect(responseCreatedUser.statusCode).toBe(200)
        expect(responseCreatedUser.body.data.role).toBe(UserRole.USER)
        const responseDeletedUser = await request(BASE_URL).delete(TEST_URLS.usersMe).set('Authorization', `Bearer ${testToken}`)
        expect(responseDeletedUser.statusCode).toBe(200)
    })

    it('Should return 400, with short firstName error', async () => {
        let testUserShortFirstName = {...TEST_USER, firstName: 'T'}
        const response = await request(BASE_URL).post(TEST_URLS.newUser).send(testUserShortFirstName)
        expect(response.statusCode).toBe(400)
        expect(response.body.error).toBe(userErrors.firstNameError)
    })

    it('Should return 400, with long firstName error', async () => {
        let testUserLongFirstName = {...TEST_USER, firstName: 'ThisIsAFirstNameThabody.errorentTheLimitImposedByTheSystem'.repeat(41)}
        const response = await request(BASE_URL).post(TEST_URLS.newUser).send(testUserLongFirstName)
        expect(response.statusCode).toBe(400)
        expect(response.body.error).toBe(userErrors.firstNameError)
    })

    it('Should return 400, with short lastName error', async () => {
        let testUserShortLastName = {...TEST_USER, lastName: 'T'}
        const response = await request(BASE_URL).post(TEST_URLS.newUser).send(testUserShortLastName)
        expect(response.statusCode).toBe(400)
        expect(response.body.error).toBe(userErrors.lastNameError)
    })

    it('Should return 400, with long lastName error', async () => {
        let testUserLongLastName = {...TEST_USER, lastName: 'ThisIsALastNameThabody.errorentTheLimitImposedByTheSystem'.repeat(41)}
        const response = await request(BASE_URL).post(TEST_URLS.newUser).send(testUserLongLastName)
        expect(response.statusCode).toBe(400)
        expect(response.body.error).toBe(userErrors.lastNameError)
    })

    it('Should return 400, with short username error', async () => {
        let testUserShortUsername = {...TEST_USER, username: 'T'}
        const response = await request(BASE_URL).post(TEST_URLS.newUser).send(testUserShortUsername)
        expect(response.statusCode).toBe(400)
        expect(response.body.error).toBe(userErrors.usernameError)
    })

    it('Should return 400, with long username error', async () => {
        let testUserLongUsername = {...TEST_USER, username: 'ThisIsAUsernameThabody.errorentTheLimitImposedByTheSystem'.repeat(41)}
        const response = await request(BASE_URL).post(TEST_URLS.newUser).send(testUserLongUsername)
        expect(response.statusCode).toBe(400)
        expect(response.body.error).toBe(userErrors.usernameError)
    })

    it('Should return 400, with invalid email format error', async () => {
        let testUserInvalidEmail = {...TEST_USER, email: 'invalidemail'}
        const response = await request(BASE_URL).post(TEST_URLS.newUser).send(testUserInvalidEmail)
        expect(response.statusCode).toBe(400)
        expect(response.body.error).toBe(userErrors.invalidEmailFormatError)
    })

    it('Should return 400, with existing username error', async () => {
        const response = await request(BASE_URL).post(TEST_URLS.newUser).send(TEST_USER)
        expect(response.statusCode).toBe(400)
        expect(response.body.error).toBe(userErrors.existingUsernameError)
    })

    it('Should return 400, with existing username error', async () => {
        let testUserExistingUsername = {...TEST_USER, username: TEST_USER.username + "            "}
        const response = await request(BASE_URL).post(TEST_URLS.newUser).send(testUserExistingUsername)
        expect(response.statusCode).toBe(400)
        expect(response.body.error).toBe(userErrors.existingUsernameError)
    })

    it('Should return 400, with existing email error', async () => {
        let testUserExistingUsername = {...TEST_USER, username: "newUserName"}
        const response = await request(BASE_URL).post(TEST_URLS.newUser).send(testUserExistingUsername)
        expect(response.statusCode).toBe(400)
        expect(response.body.error).toBe(userErrors.existingEmailError)
    })

    it('Should return 400, with invalid plan error', async () => {
        let testUserInvalidPlan = {...TEST_USER, username: "newUserName", email: "newemail@example.com", plan: 'invalidplan'}
        const response = await request(BASE_URL).post(TEST_URLS.newUser).send(testUserInvalidPlan)
        expect(response.statusCode).toBe(400)
        expect(response.body.error).toBe(userErrors.invalidPlanError)
    })
})

// ---------------------------- LOGIN ----------------------------

describe(`POST ${TEST_URLS.login}`, () => {
    
    let token = "";

    beforeAll(async () => {
        const response = await request(BASE_URL).post(TEST_URLS.newUser).send(TEST_USER)
        expect(response.statusCode).toBe(201)
        token = response.body.data
    })

    afterAll(async () => {
        const response = await request(BASE_URL).delete(TEST_URLS.usersMe).set('Authorization', `Bearer ${token}`)
        expect(response.statusCode).toBe(200)
    })

    it('Should return 200', async () => {
        const response = await request(BASE_URL).post(TEST_URLS.login).send({username: TEST_USER.username, password: TEST_USER.password})
        expect(response.statusCode).toBe(200)
    })

    it('Should return 200, username has spaces', async () => {
        const response = await request(BASE_URL).post(TEST_URLS.login).send({username: TEST_USER.username + "       ", password: TEST_USER.password})
        expect(response.statusCode).toBe(200)
    })

    it('Should return 200, login with admin', async () => {
        const response = await request(BASE_URL).post(TEST_URLS.login).send(ADMIN_USER_CREDENTIALS)
        expect(response.statusCode).toBe(200)
    })

    it('Should return 400, with invalid username error', async () => {
        const response = await request(BASE_URL).post(TEST_URLS.login).send({username: TEST_USER.username + "invalid", password: TEST_USER.password})
        expect(response.statusCode).toBe(400)
        expect(response.body.error).toBe(userErrors.invalidUsernameOrPasswordError)
    })

    it('Should return 400, with invalid password error', async () => {
        const response = await request(BASE_URL).post(TEST_URLS.login).send({username: TEST_USER.username, password: TEST_USER.password + "invalid"})
        expect(response.statusCode).toBe(400)
        expect(response.body.error).toBe(userErrors.invalidUsernameOrPasswordError)
    })

    it('Should return 400, with invalid password error', async () => {
        const response = await request(BASE_URL).post(TEST_URLS.login).send({username: TEST_USER.username, password: TEST_USER.password + "        "})
        expect(response.statusCode).toBe(400)
        expect(response.body.error).toBe(userErrors.invalidUsernameOrPasswordError)
    })
})

// ---------------------------- UPDATE BY USERNAME ----------------------------

describe(`PUT ${TEST_URLS.usersUpdate}`, () => {

    let testUserToken = "";
    let adminToken = "";

    beforeAll(async () => {
        const createTestUserResponse = await request(BASE_URL).post(TEST_URLS.newUser).send(TEST_USER)
        expect(createTestUserResponse.statusCode).toBe(201)
        testUserToken = createTestUserResponse.body.data
        const adminLoginResponse = await request(BASE_URL).post(TEST_URLS.login).send(ADMIN_USER_CREDENTIALS)
        expect(adminLoginResponse.statusCode).toBe(200)
        adminToken = adminLoginResponse.body.data
    })

    afterAll(async () => {
        const response = await request(BASE_URL).delete(TEST_URLS.usersMe).set('Authorization', `Bearer ${testUserToken}`)
        expect(response.statusCode).toBe(200)
    })

    it('Should return 200', async () => {
        const responseUpdate = await request(BASE_URL).put(TEST_URLS.usersUpdate.replace(':username', TEST_USER.username)).send({username: TEST_USER.username+"updated"}).set('Authorization', `Bearer ${adminToken}`)
        expect(responseUpdate.statusCode).toBe(200)
        expect(responseUpdate.body.message).toBe("User updated!")

        const responseUserData = await request(BASE_URL).get(TEST_URLS.users.replace(":username", TEST_USER.username+"updated")).set('Authorization', `Bearer ${adminToken}`)
        expect(responseUserData.statusCode).toBe(200)

        const responseUpdateReturn = await request(BASE_URL).put(TEST_URLS.usersUpdate.replace(':username', TEST_USER.username+"updated")).send({username: TEST_USER.username}).set('Authorization', `Bearer ${adminToken}`)
        expect(responseUpdateReturn.statusCode).toBe(200)
        expect(responseUpdateReturn.body.message).toBe("User updated!")

        const responseUserDataReturn = await request(BASE_URL).get(TEST_URLS.users.replace(":username", TEST_USER.username)).set('Authorization', `Bearer ${adminToken}`)
        expect(responseUserDataReturn.statusCode).toBe(200)
    })

    it('Should return 400, with short firstName error', async () => {
        let testUserShortFirstName = {...TEST_USER, firstName: 'T'}
        const response = await request(BASE_URL).put(TEST_URLS.usersUpdate.replace(':username', TEST_USER.username)).send(testUserShortFirstName).set('Authorization', `Bearer ${adminToken}`)
        expect(response.statusCode).toBe(400)
        expect(response.body.error).toBe(userErrors.firstNameError)
    })

    it('Should return 400, with long firstName error', async () => {
        let testUserLongFirstName = {...TEST_USER, firstName: 'ThisIsAFirstNameThabody.errorentTheLimitImposedByTheSystem'.repeat(41)}
        const response = await request(BASE_URL).put(TEST_URLS.usersUpdate.replace(':username', TEST_USER.username)).send(testUserLongFirstName).set('Authorization', `Bearer ${adminToken}`)
        expect(response.statusCode).toBe(400)
        expect(response.body.error).toBe(userErrors.firstNameError)
    })

    it('Should return 400, with short lastName error', async () => {
        let testUserShortLastName = {...TEST_USER, lastName: 'T'}
        const response = await request(BASE_URL).put(TEST_URLS.usersUpdate.replace(':username', TEST_USER.username)).send(testUserShortLastName).set('Authorization', `Bearer ${adminToken}`)
        expect(response.statusCode).toBe(400)
        expect(response.body.error).toBe(userErrors.lastNameError)
    })

    it('Should return 400, with long lastName error', async () => {
        let testUserLongLastName = {...TEST_USER, lastName: 'ThisIsALastNameThabody.errorentTheLimitImposedByTheSystem'.repeat(41)}
        const response = await request(BASE_URL).put(TEST_URLS.usersUpdate.replace(':username', TEST_USER.username)).send(testUserLongLastName).set('Authorization', `Bearer ${adminToken}`)
        expect(response.statusCode).toBe(400)
        expect(response.body.error).toBe(userErrors.lastNameError)
    })

    it('Should return 400, with short username error', async () => {
        let testUserShortUsername = {...TEST_USER, username: 'T'}
        const response = await request(BASE_URL).put(TEST_URLS.usersUpdate.replace(':username', TEST_USER.username)).send(testUserShortUsername).set('Authorization', `Bearer ${adminToken}`)
        expect(response.statusCode).toBe(400)
        expect(response.body.error).toBe(userErrors.usernameError)
    })

    it('Should return 400, with long username error', async () => {
        let testUserLongUsername = {...TEST_USER, username: 'ThisIsAUsernameThabody.errorentTheLimitImposedByTheSystem'.repeat(41)}
        const response = await request(BASE_URL).put(TEST_URLS.usersUpdate.replace(':username', TEST_USER.username)).send(testUserLongUsername).set('Authorization', `Bearer ${adminToken}`)
        expect(response.statusCode).toBe(400)
        expect(response.body.error).toBe(userErrors.usernameError)
    })

    it('Should return 400, with invalid email format error', async () => {
        let testUserInvalidEmail = {...TEST_USER, email: 'invalidemail'}
        const response = await request(BASE_URL).put(TEST_URLS.usersUpdate.replace(':username', TEST_USER.username)).send(testUserInvalidEmail).set('Authorization', `Bearer ${adminToken}`)
        expect(response.statusCode).toBe(400)
        expect(response.body.error).toBe(userErrors.invalidEmailFormatError)
    })

    it('Should return 400, with invalid username error', async () => {
        const response = await request(BASE_URL).put(TEST_URLS.usersUpdate.replace(':username', TEST_USER.username)).send({username: USERS_TO_GET_DATA_FROM.firstUser.username}).set('Authorization', `Bearer ${adminToken}`)
        expect(response.statusCode).toBe(400)
        expect(response.body.error).toBe(userErrors.existingUsernameError)
    })

    it('Should return 400, with invalid username error', async () => {
        const response = await request(BASE_URL).put(TEST_URLS.usersUpdate.replace(':username', TEST_USER.username)).send({username: USERS_TO_GET_DATA_FROM.firstUser.username+"       "}).set('Authorization', `Bearer ${adminToken}`)
        expect(response.statusCode).toBe(400)
        expect(response.body.error).toBe(userErrors.existingUsernameError)
    })

    it('Should return 400, with existing email error', async () => {
        let testUserExistingUsername = {...TEST_USER, email: USERS_TO_GET_DATA_FROM.firstUser.email}
        const response = await request(BASE_URL).put(TEST_URLS.usersUpdate.replace(':username', TEST_USER.username)).send(testUserExistingUsername).set('Authorization', `Bearer ${adminToken}`)
        expect(response.statusCode).toBe(400)
        expect(response.body.error).toBe(userErrors.existingEmailError)
    })

    it('Should return 400, with invalid plan error', async () => {
        let testUserInvalidPlan = {...TEST_USER, plan: 'invalidplan'}
        const response = await request(BASE_URL).put(TEST_URLS.usersUpdate.replace(':username', TEST_USER.username)).send(testUserInvalidPlan).set('Authorization', `Bearer ${adminToken}`)
        expect(response.statusCode).toBe(400)
        expect(response.body.error).toBe(userErrors.invalidPlanError)
    })

    it('Should return 401, with not permission error', async () => {
        const response = await request(BASE_URL).put(TEST_URLS.usersUpdate.replace(':username', TEST_USER.username)).send({username: TEST_USER.username+"updated"}).set('Authorization', `Bearer ${testUserToken}`)
        expect(response.statusCode).toBe(401)
        expect(response.body.error).toBe(userErrors.cannotUpdateUserError)
    })

    it('Should return 401, with invalid token error', async () => {
        const response = await request(BASE_URL).put(TEST_URLS.usersUpdate.replace(':username', TEST_USER.username)).set('Authorization', `Bearer ${adminToken}invalid`)
        expect(response.statusCode).toBe(401)
        expect(response.body.error).toBe(jwtErrors.invalidTokenError)
    })

    it('Should return 401, with no token error', async () => {
        const response = await request(BASE_URL).put(TEST_URLS.usersUpdate.replace(':username', TEST_USER.username))
        expect(response.statusCode).toBe(401)
        expect(response.body.error).toBe(jwtErrors.tokenNeededError)
    })

    it('Should return 403, with cannot update admin error', async () => {
        const response = await request(BASE_URL).put(TEST_URLS.usersUpdate.replace(':username', ADMIN_USER_CREDENTIALS.username)).send({username: TEST_USER.username+"updated"}).set('Authorization', `Bearer ${adminToken}`)
        expect(response.statusCode).toBe(403)
        expect(response.body.error).toBe(userErrors.cannotUpdateUserError)
    })

})

// ---------------------------- UPDATE ME ----------------------------

describe(`PUT ${TEST_URLS.usersMe}`, () => {

    let token = "";

    beforeAll(async () => {
        const response = await request(BASE_URL).post(TEST_URLS.newUser).send(TEST_USER)
        expect(response.statusCode).toBe(201)
        token = response.body.data
    })

    afterAll(async () => {
        const response = await request(BASE_URL).delete(TEST_URLS.usersMe).set('Authorization', `Bearer ${token}`)
        expect(response.statusCode).toBe(200)
    })

    it('Should return 200', async () => {
        const response = await request(BASE_URL).put(TEST_URLS.usersMe).send({username: TEST_USER.username+"updated"}).set('Authorization', `Bearer ${token}`)
        expect(response.statusCode).toBe(200)
        expect(response.body.message).toBe("User updated!")

        const responseLogin = await request(BASE_URL).post(TEST_URLS.login).send({username: TEST_USER.username+"updated", password: TEST_USER.password})
        expect(responseLogin.statusCode).toBe(200)
        token = responseLogin.body.data

        const responseUserData = await request(BASE_URL).get(TEST_URLS.usersMe).set('Authorization', `Bearer ${token}`)
        expect(responseUserData.statusCode).toBe(200)
        expect(responseUserData.body.data.username).toBe(TEST_USER.username+"updated")

        const responseUpdateReturn = await request(BASE_URL).put(TEST_URLS.usersMe).send({username: TEST_USER.username}).set('Authorization', `Bearer ${token}`)
        expect(responseUpdateReturn.statusCode).toBe(200)
        expect(responseUpdateReturn.body.message).toBe("User updated!")
        token = responseUpdateReturn.body.data

        const responseLoginReturn = await request(BASE_URL).post(TEST_URLS.login).send({username: TEST_USER.username, password: TEST_USER.password})
        expect(responseLoginReturn.statusCode).toBe(200)
        token = responseLoginReturn.body.data

        const responseUserDataReturn = await request(BASE_URL).get(TEST_URLS.usersMe).set('Authorization', `Bearer ${token}`)
        expect(responseUserDataReturn.statusCode).toBe(200)
        expect(responseUserDataReturn.body.data.username).toBe(TEST_USER.username)
    })

    it('Should return 400, with short firstName error', async () => {
        let testUserShortFirstName = {...TEST_USER, firstName: 'T'}
        const response = await request(BASE_URL).put(TEST_URLS.usersMe).send(testUserShortFirstName).set('Authorization', `Bearer ${token}`)
        expect(response.statusCode).toBe(400)
        expect(response.body.error).toBe(userErrors.firstNameError)
    })

    it('Should return 400, with long firstName error', async () => {
        let testUserLongFirstName = {...TEST_USER, firstName: 'ThisIsAFirstNameThabody.errorentTheLimitImposedByTheSystem'.repeat(41)}
        const response = await request(BASE_URL).put(TEST_URLS.usersMe).send(testUserLongFirstName).set('Authorization', `Bearer ${token}`)
        expect(response.statusCode).toBe(400)
        expect(response.body.error).toBe(userErrors.firstNameError)
    })

    it('Should return 400, with short lastName error', async () => {
        let testUserShortLastName = {...TEST_USER, lastName: 'T'}
        const response = await request(BASE_URL).put(TEST_URLS.usersMe).send(testUserShortLastName).set('Authorization', `Bearer ${token}`)
        expect(response.statusCode).toBe(400)
        expect(response.body.error).toBe(userErrors.lastNameError)
    })

    it('Should return 400, with long lastName error', async () => {
        let testUserLongLastName = {...TEST_USER, lastName: 'ThisIsALastNameThabody.errorentTheLimitImposedByTheSystem'.repeat(41)}
        const response = await request(BASE_URL).put(TEST_URLS.usersMe).send(testUserLongLastName).set('Authorization', `Bearer ${token}`)
        expect(response.statusCode).toBe(400)
        expect(response.body.error).toBe(userErrors.lastNameError)
    })

    it('Should return 400, with short username error', async () => {
        let testUserShortUsername = {...TEST_USER, username: 'T'}
        const response = await request(BASE_URL).put(TEST_URLS.usersMe).send(testUserShortUsername).set('Authorization', `Bearer ${token}`)
        expect(response.statusCode).toBe(400)
        expect(response.body.error).toBe(userErrors.usernameError)
    })

    it('Should return 400, with long username error', async () => {
        let testUserLongUsername = {...TEST_USER, username: 'ThisIsAUsernameThabody.errorentTheLimitImposedByTheSystem'.repeat(41)}
        const response = await request(BASE_URL).put(TEST_URLS.usersMe).send(testUserLongUsername).set('Authorization', `Bearer ${token}`)
        expect(response.statusCode).toBe(400)
        expect(response.body.error).toBe(userErrors.usernameError)
    })

    it('Should return 400, with invalid email format error', async () => {
        let testUserInvalidEmail = {...TEST_USER, email: 'invalidemail'}
        const response = await request(BASE_URL).put(TEST_URLS.usersMe).send(testUserInvalidEmail).set('Authorization', `Bearer ${token}`)
        expect(response.statusCode).toBe(400)
        expect(response.body.error).toBe(userErrors.invalidEmailFormatError)
    })

    it('Should return 400, with invalid username error', async () => {
        const response = await request(BASE_URL).put(TEST_URLS.usersMe).send({username: USERS_TO_GET_DATA_FROM.firstUser.username}).set('Authorization', `Bearer ${token}`)
        expect(response.statusCode).toBe(400)
        expect(response.body.error).toBe(userErrors.existingUsernameError)
    })

    it('Should return 400, with invalid username error', async () => {
        const response = await request(BASE_URL).put(TEST_URLS.usersMe).send({username: USERS_TO_GET_DATA_FROM.firstUser.username+"       "}).set('Authorization', `Bearer ${token}`)
        expect(response.statusCode).toBe(400)
        expect(response.body.error).toBe(userErrors.existingUsernameError)
    })

    it('Should return 400, with existing email error', async () => {
        let testUserExistingUsername = {...TEST_USER, email: USERS_TO_GET_DATA_FROM.firstUser.email}
        const response = await request(BASE_URL).put(TEST_URLS.usersMe).send(testUserExistingUsername).set('Authorization', `Bearer ${token}`)
        expect(response.statusCode).toBe(400)
        expect(response.body.error).toBe(userErrors.existingEmailError)
    })

    it('Should return 400, with invalid plan error', async () => {
        let testUserInvalidPlan = {...TEST_USER, plan: 'invalidplan'}
        const response = await request(BASE_URL).put(TEST_URLS.usersMe).send(testUserInvalidPlan).set('Authorization', `Bearer ${token}`)
        expect(response.statusCode).toBe(400)
        expect(response.body.error).toBe(userErrors.invalidPlanError)
    })

    it('Should return 401, with invalid token error', async () => {
        const response = await request(BASE_URL).put(TEST_URLS.usersMe).set('Authorization', `Bearer ${token}invalid`)
        expect(response.statusCode).toBe(401)
        expect(response.body.error).toBe(jwtErrors.invalidTokenError)
    })

    it('Should return 401, with no token error', async () => {
        const response = await request(BASE_URL).put(TEST_URLS.usersMe)
        expect(response.statusCode).toBe(401)
        expect(response.body.error).toBe(jwtErrors.tokenNeededError)
    })
})

// ---------------------------- DELETE ----------------------------

describe(`DELETE ${TEST_URLS.usersMe}`, () => {
    
        let token = "";
    
        beforeAll(async () => {
            const response = await request(BASE_URL).post(TEST_URLS.newUser).send(TEST_USER)
            expect(response.statusCode).toBe(201)
            token = response.body.data
        })
    
        it('Should return 200', async () => {
            const response = await request(BASE_URL).delete(TEST_URLS.usersMe).set('Authorization', `Bearer ${token}`)
            expect(response.statusCode).toBe(200)
        })
    
        it('Should return 401, with invalid token error', async () => {
            const response = await request(BASE_URL).delete(TEST_URLS.usersMe).set('Authorization', `Bearer ${token}invalid`)
            expect(response.statusCode).toBe(401)
            expect(response.body.error).toBe(jwtErrors.invalidTokenError)
        })
    
        it('Should return 401, with no token error', async () => {
            const response = await request(BASE_URL).delete(TEST_URLS.usersMe)
            expect(response.statusCode).toBe(401)
            expect(response.body.error).toBe(jwtErrors.tokenNeededError)
        })
})