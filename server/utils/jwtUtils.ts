import { Request, Response } from 'express'
import * as jwt from 'jsonwebtoken'
import { IUser } from '../db/models/user'

const JWT_SECRET: string = process.env.JWT_SECRET ?? ''

interface IPayload {
    payload: IUser,
    iat: number,
    exp: number
}

if (JWT_SECRET === '') {
    console.error('JWT_SECRET environment variable not set!')
    process.exit(1)
}

function generateToken(payload: object, res: Response) {
    let token = jwt.sign({ payload }, JWT_SECRET, {
        algorithm: 'HS256',
        expiresIn: '1h',
    })

    if (token === '') {
        res.status(500).send('Error generating token!')
    } else {
        return token
    }
}

function verifyToken(req: Request, res: Response) {
    let bearerHeader = req.headers['authorization']

    if (typeof bearerHeader === 'undefined') {
        res.sendStatus(401)
    } else {
        let bearer: string[] = bearerHeader.split(' ')
        let bearerToken: string = bearer[1]
        let token: string = bearerToken

        let payload: IPayload= jwt.verify(token, JWT_SECRET, {
            algorithms: ['HS256'],
        }) as IPayload

        return payload.payload as IUser;
    }
}

export { generateToken, verifyToken }
