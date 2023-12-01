import express, { Request, Response } from 'express'
import { IUser, PlanType, User } from '../db/models/user'
import { generateToken, getPayloadFromToken } from '../utils/jwtUtils'
import { validateUser } from '../utils/validators/userValidator'
import bcrypt from 'bcrypt'
import { userErrors } from '../utils/errorMessages/users'

const router = express.Router()

const SALT_ROUNDS: number = parseInt(process.env.SALT_ROUNDS || "10");
const salt = bcrypt.genSaltSync(SALT_ROUNDS);

const EMPTY_USER: IUser = {
    firstName: '',
    lastName: '',
    username: '',
    password: '',
    email: '',
    plan: PlanType.FREE,
}

router.get('/me', async (req: Request, res: Response) => {
    let decodedToken: IUser = getPayloadFromToken(req)

    const user = await User.findOne({ username: decodedToken.username })

    return res.status(200).json({ data: user })
})

router.get('/:userId', async (req: Request, res: Response) => {
    const user = await User.findById(req.params.userId).select('-password')

    if (!user) {
        return res.status(404).send({ error: 'User does not exist!' })
    }

    return res.status(200).json({ data: user })
})

router.post('/new', async (req: Request, res: Response) => {
    let userData: IUser = req.body

    userData = { ...EMPTY_USER, ...userData }

    await validateUser(userData, res);

    if (res.statusCode !== 200) {
        return res;
    }else{

        const hash = bcrypt.hashSync(userData.password, salt);

        userData.password = hash;

        const user = User.build(userData)

        user.save()
    
        let token = generateToken(user, res)
    
        return res.status(201).json({ data: token })
    }

})

router.post('/login', async (req: Request, res: Response) => {
    const { username, password }: FormInputs = req.body

    const user = await User.findOne({ username: username })

    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(400).send({ error: userErrors.invalidUsernameOrPasswordError })
    }

    let token = generateToken(user, res)

    return res.status(200).json({ data: token })
})

router.put('/:userId', async (req: Request, res: Response) => {
    const userData: object = req.body

    if (!userData) {
        return res.status(400).send({ error: 'No user data sent!' })
    }
    try {
        await User.findByIdAndUpdate(req.params.userId, {
            $set: { ...userData },
        })

        return res.status(200).json({ message: 'User updated!' })
    } catch (err) {
        return res.status(400).send({ error: err ?? 'Something went wrong while updating the user' })
    }
})

router.delete('/me', async (req: Request, res: Response) => {
    let decodedToken: IUser = getPayloadFromToken(req)

    await User.findOneAndDelete({ data: decodedToken.username })

    return res.status(200).json({ message: 'User deleted!' })
})

export default router
