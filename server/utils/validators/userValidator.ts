import { IUser, PlanType, User } from '../../db/models/user'
import { Response } from 'express'
import { userErrors } from '../errorMessages/users'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function validateUser(user: IUser, res: Response) {
    if (!user) {
        res.status(400).send('No user data sent!')
    }else if (user.firstName.trim().length < 3 || user.firstName.trim().length > 40) {
        res
            .status(400)
            .send(
                userErrors.firstNameError
            )
    }else if (user.lastName.trim().length < 3 || user.lastName.trim().length > 40) {
        res
            .status(400)
            .send(
                userErrors.lastNameError
            )
    }else if (user.username.trim().length < 3 || user.username.trim().length > 40) {
        res
            .status(400)
            .send(userErrors.usernameError)
    }else if (!EMAIL_REGEX.test(user.email.trim())) {
        res.status(400).send(userErrors.invalidEmailFormatError)
    }else if ((await User.findOne({ username: user.username.trim() })) !== null) {
        res
            .status(400)
            .send(userErrors.existingUsernameError)
    }else if ((await User.findOne({ email: user.email.trim() })) !== null) {
        return res.status(400).send(userErrors.existingEmailError)
    }else if (!Object.values(PlanType).includes(user.plan)) {
        res
            .status(400)
            .send(userErrors.invalidPlanError)
    }
}

export { validateUser }
