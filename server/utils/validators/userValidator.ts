import { IUser, PlanType, User } from '../../db/models/user'
import { Response } from 'express'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function validateUser(user: IUser, res: Response) {
    if (!user) {
        res.status(400).send('No user data sent!')
    }else if (user.firstName.trim().length < 3 || user.firstName.trim().length > 40) {
        res
            .status(400)
            .send(
                "The user's first name must be between 3 and 40 characters long"
            )
    }else if (user.lastName.trim().length < 3 || user.lastName.trim().length > 40) {
        res
            .status(400)
            .send(
                "The user's last name must be between 3 and 40 characters long"
            )
    }else if (user.username.trim().length < 3 || user.username.trim().length > 40) {
        res
            .status(400)
            .send('The username name must be between 3 and 40 characters long')
    }else if (!EMAIL_REGEX.test(user.email.trim())) {
        res.status(400).send('The email format is invalid')
    }else if ((await User.findOne({ username: user.username.trim() })) !== null) {
        res
            .status(400)
            .send('There is already a user with that username')
    }else if ((await User.findOne({ email: user.email.trim() })) !== null) {
        return res.status(400).send('There is already a user with that email')
    }else if (!Object.values(PlanType).includes(user.plan)) {
        res
            .status(400)
            .send('The plan assigned to the user is not valid is not valid')
    }
}

export { validateUser }
