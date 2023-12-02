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

// ------------------ GET ROUTES ------------------

router.get('/me', async (req: Request, res: Response) => {
    let decodedToken: IUser = getPayloadFromToken(req)

    User.findOne({ username: decodedToken.username })
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

router.put('/:username', async (req: Request, res: Response) => {
    let decodedToken: IUser = getPayloadFromToken(req)

    if (decodedToken.role !== UserRole.ADMIN) {
        return res.status(401).send({ error: userErrors.cannotUpdateUserError })
    }

    let userData = req.body

    if (!userData) {
        return res.status(400).send({ error: userErrors.noUserDataError })
    }

    User.findOne({ username: req.params.username })
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

                User.updateOne({ username: req.params.username }, user)
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
})

// ------------------ DELETE ROUTES ------------------

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

export default router
