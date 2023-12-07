import express, { Request, Response } from 'express'
import { IUser, PlanType, User, UserRole } from '../db/models/user'
import { generateToken, getPayloadFromToken } from '../utils/jwtUtils'
import { validateUser } from '../utils/validators/userValidator'
import bcrypt from 'bcrypt'
import { userErrors } from '../utils/errorMessages/users'

interface FormInputs {
    username: string
    password: string
}

const router = express.Router()

const SALT_ROUNDS: number = parseInt(process.env.SALT_ROUNDS ?? '10')
const salt = bcrypt.genSaltSync(SALT_ROUNDS)

const EMPTY_USER: IUser = {
    firstName: '',
    lastName: '',
    username: '',
    password: '',
    email: '',
    plan: PlanType.FREE,
    role: UserRole.USER,
}

/**
 * @swagger
 * components:
 *   schemas:
 *     UserLogin:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           description: The username of the user
 *         password:
 *           type: string
 *           description: The password of the user
 *       example:
 *         username: johndoe
 *         password: johnpassword
 *     UserPost:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - username
 *         - password
 *         - email
 *       properties:
 *         firstName:
 *           type: string
 *           description: The first name of the user
 *         lastName:
 *           type: string
 *           description: The last name of the user
 *         username:
 *           type: string
 *           description: The username of the user
 *         password:
 *           type: string
 *           description: The password of the user
 *         email:
 *           type: string
 *           description: The email of the user
 *           format: email
 *         plan:
 *           type: string
 *           description: The plan of the user
 *           enum: [FREE, PREMIUM, PRO]
 *         role:
 *           type: string
 *           description: The role of the user
 *           enum: [USER, ADMIN]
 *       example:
 *         firstName: John
 *         lastName: Doe
 *         username: johndoe
 *         password: johnpassword
 *         email: johndoe@test.com
 *         plan: FREE
 *         role: USER
 *     UserPut:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *           description: The first name of the user
 *         lastName:
 *           type: string
 *           description: The last name of the user
 *         username:
 *           type: string
 *           description: The username of the user
 *         password:
 *           type: string
 *           description: The password of the user
 *         email:
 *           type: string
 *           description: The email of the user
 *           format: email
 *         plan:
 *           type: string
 *           description: The plan of the user
 *           enum: [FREE, PREMIUM, PRO]
 *         role:
 *           type: string
 *           description: The role of the user
 *           enum: [USER, ADMIN]
 *       example:
 *         firstName: John
 *         lastName: Doe
 *         username: johndoe
 *         password: johnpassword
 *         email: johndoe@test.com
 *         plan: FREE
 *         role: USER
 *     User:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - username
 *         - email
 *         - plan
 *         - role
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the user
 *         firstName:
 *           type: string
 *           description: The first name of the user
 *         lastName:
 *           type: string
 *           description: The last name of the user
 *         username:
 *           type: string
 *           description: The username of the user
 *         email:
 *           type: string
 *           description: The email of the user
 *           format: email
 *         plan:
 *           type: string
 *           description: The plan of the user
 *           enum: [FREE, PREMIUM, PRO]
 *         role:
 *           type: string
 *           description: The role of the user
 *           enum: [USER, ADMIN]
 *       example:
 *         id: 60b0a1b7c9e8a1b9c8a1b9c8
 *         firstName: John
 *         lastName: Doe
 *         username: johndoe
 *         email: johndoe@test.com
 *         plan: FREE
 *         role: USER
 *     UserList:
 *       type: object
 *       required:
 *         - data
 *       properties:
 *         data:
 *           type: object
 *           description: The user
 *           $ref: '#/components/schemas/User'
 *     JWTList:
 *       type: object
 *       required:
 *         - data
 *       properties:
 *         data:
 *           type: string
 *           description: The JWT token
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2Vybm...
 */

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: The users managing API
 */


// ------------------ GET ROUTES ------------------

/**
 * @swagger
 * /me:
 *   get:
 *     summary: Returns the info of the user that is logged in
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: The info was successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserList'
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
router.get('/me', async (req: Request, res: Response) => {
    let decodedToken: IUser = getPayloadFromToken(req)

    User.findOne({ username: decodedToken.username })
        .select('-password')
        .then((user) => {
            if (!user) {
                return res
                    .status(404)
                    .send({ error: userErrors.userNotExistError })
            }

            return res.status(200).json({ data: user })
        })
        .catch((err) => {
            return res
                .status(400)
                .send({
                    error: err ?? 'Something went wrong while getting the user',
                })
        })
})

/**
 * @swagger
 * /{username}:
 *   get:
 *     summary: Returns the info of the user that has the username passed as parameter
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: username
 *         schema:
 *           type: string
 *         required: true
 *         description: The username of the user to get
 *         example: johndoe
 *     responses:
 *       200:
 *         description: The info was successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserList'
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
router.get('/:username', async (req: Request, res: Response) => {
    User.findOne({ username: req.params.username })
        .select('-password')
        .then((user) => {
            if (!user) {
                return res
                    .status(404)
                    .send({ error: userErrors.userNotExistError })
            }

            return res.status(200).json({ data: user })
        })
        .catch((err) => {
            return res
                .status(400)
                .send({
                    error: err ?? 'Something went wrong while getting the user',
                })
        })
})

// ------------------ POST ROUTES ------------------
/**
 * @swagger
 * /new:
 *   post:
 *     summary: Creates a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserPost'
 *     security: []
 *     responses:
 *       201:
 *         description: The user was successfully created (returns the JWT token)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/JWTList'
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
router.post('/new', async (req: Request, res: Response) => {
    let userData: IUser = req.body

    userData = { ...EMPTY_USER, ...userData, role: UserRole.USER }

    await validateUser(userData, res)

    if (res.statusCode !== 200) {
        return res
    } else {
        const hash = bcrypt.hashSync(userData.password, salt)

        userData.password = hash

        const user = User.build(userData)

        user.save()

        let token = generateToken(user, res)

        return res.status(201).json({ data: token })
    }
})

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Logs in the user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLogin'
 *     security: []
 *     responses:
 *       200:
 *         description: The user was successfully logged in (returns the JWT token)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/JWTList'
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
router.post('/login', async (req: Request, res: Response) => {
    const { username, password }: FormInputs = req.body

    User.findOne({ username: username })
        .then((user) => {
            if (!user || !bcrypt.compareSync(password, user.password)) {
                return res
                    .status(400)
                    .send({ error: userErrors.invalidUsernameOrPasswordError })
            }

            let token = generateToken(user, res)

            return res.status(200).json({ data: token })
        })
        .catch((err) => {
            return res
                .status(400)
                .send({ error: err ?? 'Something went wrong while logging in' })
        })
})

// ------------------ PUT ROUTES ------------------
/**
 * @swagger
 * /me:
 *   put:
 *     summary: Updates the info of the user that is logged in
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserPut'
 *     responses:
 *       200:
 *         description: The info was successfully updated
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
 *       403:
 *         description: The user that made the request has not enough privileges
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error403'
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
router.put('/me', async (req: Request, res: Response) => {

    let decodedToken: IUser = getPayloadFromToken(req)

    updateUser(decodedToken.username, req.body, res).then(() => {
        return res
    }).catch((err) => {
        return res.status(400).send({ error: err })
    })

})

/**
 * @swagger
 * /{username}:
 *   put:
 *     summary: Updates the info of the user that has the username passed as parameter
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: username
 *         schema:
 *           type: string
 *         required: true
 *         description: The username of the user to update
 *         example: johndoe
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserPut'
 *     responses:
 *       200:
 *         description: The info was successfully updated
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
 *       403:
 *         description: The user that made the request has not enough privileges
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error403'
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
router.put('/:username', async (req: Request, res: Response) => {
    let decodedToken: IUser = getPayloadFromToken(req)

    if (decodedToken.role !== UserRole.ADMIN) {
        return res.status(401).send({ error: userErrors.cannotUpdateUserError })
    }

    updateUser(req.params.username, req.body, res).then(() => {
        return res
    }).catch((err) => {
        return res.status(400).send({ error: err })
    })
})

// ------------------ DELETE ROUTES ------------------
/**
 * @swagger
 * /me:
 *   delete:
 *     summary: Deletes the user that is logged in
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: The user was successfully deleted
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
router.delete('/me', async (req: Request, res: Response) => {
    let decodedToken: IUser = getPayloadFromToken(req)

    User.findOneAndDelete({ username: decodedToken.username })
        .then(() => {
            return res.status(200).json({ message: 'User deleted!' })
        })
        .catch((err) => {
            return res.status(400).send({ error: userErrors.userNotExistError })
        })
})

async function updateUser(username: string, userData: any, res: Response){

    if (!userData) {
        return res.status(400).send({ error: userErrors.noUserDataError })
    }

    User.findOne({ username: username })
        .then(async (user: IUser | null) => {
            if (!user) {
                return res
                    .status(404)
                    .send({ error: userErrors.userNotExistError })
            }

            let changedUsername = false
            let changedEmail = false

            for (let key in userData) {
                if (
                    userData.hasOwnProperty(key) &&
                    key !== 'password' &&
                    user[key] !== userData[key]
                ) {
                    if (key === 'username') {
                        changedUsername = true
                    } else if (key === 'email') {
                        changedEmail = true
                    }
                    user[key] = userData[key]
                }
            }

            await validateUser(user, res, true)

            if (res.statusCode !== 200) {
                return res
            } else {
                if (user.role === UserRole.ADMIN) {
                    return res
                        .status(403)
                        .send({ error: userErrors.cannotUpdateUserError })
                }

                if (
                    changedUsername &&
                    (await User.findOne({ username: user.username })) !== null
                ) {
                    return res
                        .status(400)
                        .send({ error: userErrors.existingUsernameError })
                }

                if (
                    changedEmail &&
                    (await User.findOne({ email: user.email })) !== null
                ) {
                    return res
                        .status(400)
                        .send({ error: userErrors.existingEmailError })
                }

                User.updateOne({ username: username }, user)
                    .then(() => {
                        return res
                            .status(200)
                            .json({ message: 'User updated!' })
                    })
                    .catch((err) => {
                        return res
                            .status(400)
                            .send({
                                error:
                                    err ??
                                    'Something went wrong while updating the user',
                            })
                    })
            }
        })
        .catch((err) => {
            return res
                .status(400)
                .send({
                    error:
                        err ?? 'Something went wrong while updating the user',
                })
        })
}

export default router