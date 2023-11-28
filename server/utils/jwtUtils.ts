import { Request, Response } from 'express'
import * as jwt from 'jsonwebtoken'
import { IUser } from '../db/models/user'

const JWT_SECRET: string = process.env.JWT_SECRET ?? ''
const JWT_EXPIRATION_TIME: string = process.env.JWT_EXPIRATION_TIME ?? ''

interface IPayload {
    payload: IUser
    iat: number
    exp: number
}

if (JWT_SECRET === '') {
    console.error('JWT_SECRET environment variable not set!')
    process.exit(1)
}

function generateToken(payload: object, res: Response) {
    let token = jwt.sign({ payload }, JWT_SECRET, {
        algorithm: 'HS256',
        expiresIn: JWT_EXPIRATION_TIME,
    })

    if (token === '') {
        res.status(500).json({message: 'Error generating token!'})
    } else {
        return token
    }
}

function verifyToken(
    req: Request,
    res: Response,
    isAllowedUrl: boolean = false
):  IPayload | undefined {

    let bearerHeader = req.headers['authorization']

    if (typeof bearerHeader === 'undefined') {
        if (!isAllowedUrl) {
            res.status(401).json({message: 'You need to provide an authorization token to use this endpoint'})
        }
        return undefined
    } else {
        let bearer: string[] = bearerHeader.split(' ')
        let bearerToken: string = bearer[1]
        let token: string = bearerToken

        try {
            let payload: IPayload = jwt.verify(token, JWT_SECRET, {
                algorithms: ['HS256'],
            }) as IPayload

            return payload;
        } catch (err) {
            if (err instanceof jwt.TokenExpiredError) {
                res.status(401).json({message: 'Token expired!'})
            } else if (err instanceof jwt.JsonWebTokenError) {
                res.status(401).json({message: 'Invalid token!'})
            } else {
                res.status(500).json({message: 'Error verifying token!'})
            }
            return undefined;
        }
    }
}

function getPayloadFromToken(req: Request): IUser{
    let bearerHeader = req.headers['authorization'] as string;

    let bearer: string[] = bearerHeader.split(' ')
    let bearerToken: string = bearer[1]
    let token: string = bearerToken

    let payload: IPayload = jwt.verify(token, JWT_SECRET, {
        algorithms: ['HS256'],
    }) as IPayload

    return payload.payload;
}

export { generateToken, verifyToken, getPayloadFromToken }
