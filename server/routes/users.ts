import express, { Request, Response } from 'express'
import { IUser, User } from '../db/models/user'
import { generateToken, getPayloadFromToken } from '../utils/jwtUtils'

const router = express.Router()

router.get('/me', async (req: Request, res: Response) => {
    let decodedToken: IUser = getPayloadFromToken(req);

    const user = await User.findOne({ username: decodedToken.username })

    return res.status(200).json(user)
})

router.get('/:userId', async (req: Request, res: Response) => {

    const user = await User.findById(req.params.userId).select('-password')

    if (!user) {
        return res.status(404).send('User does not exist!')
    }

    return res.status(200).json(user)
})

router.post('/', async (req: Request, res: Response) => {
    const userData: IUser = req.body

    if (!userData) {
        return res.status(400).send('No user data sent!')
    }

    const user = User.build(userData)

    try {
        await user.save()
    } catch (err) {
        return res.status(400).send('Username or email already exist!')
    }

    let token = generateToken(user, res)

    return res.status(201).json({ jwtToken: token })
})

router.post('/login', async (req: Request, res: Response) => {
    const { username, password }: FormInputs = req.body

    const user = await User.findOne({ username: username, password: password })

    if (!user) {
        return res.status(404).send('User does not exist!')
    }

    let token = generateToken(user, res)

    return res.status(200).json({ jwtToken: token })
})

router.put('/:userId', async (req: Request, res: Response) => {
    const userData: object = req.body

    if (!userData) {
        return res.status(400).send('No user data sent!')
    }
    try {
        await User.findByIdAndUpdate(req.params.userId, {$set: {...userData}})

        return res.status(200).json({ message: 'User updated!' })

    } catch (err) {
        return res.status(400).send(err)
    }
})

router.delete('/me', async (req: Request, res: Response) => {

    let decodedToken: IUser = getPayloadFromToken(req);

    await User.findOneAndDelete({ username: decodedToken.username })

    return res.status(200).json({ message: 'User deleted!' })

})

export default router
