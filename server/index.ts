import express, { Express, Request, Response } from 'express'
import cors from 'cors'
import './loadEnvironment'
import users from './routes/users'
import messages from './routes/messages'
import './db/conn'
import { generateToken, verifyToken } from './utils/jwtUtils'
import swaggerjsdoc from 'swagger-jsdoc'
import swaggerui from 'swagger-ui-express'

const app: Express = express()

app.use(express.json())
app.use(cors())

const swaggerJsDoc = swaggerjsdoc
const swaggerUI = swaggerui

const swaggerOptions = {
    definition: {
        openapi: '3.1.0',
        info: {
            version: '1.0.0',
            title: 'Users Microservice API',
            description:
                'API for the users microservice of the FIS-G4 project.',
            contact: {
                name: 'Francisco Javier Cavero López & Alejandro García Fernández',
                email: '',
                url: 'https://github.com/fis-g4/users-microservice',
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT',
            },
        },
        servers: [
            {
                url: process.env.BASE_URL ?? 'http://localhost:8000/v1/users',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./routes/users.ts', './routes/messages.ts'],
}

const swaggerDocs = swaggerJsDoc(swaggerOptions)

app.use((req, res, next) => {

    let bearerHeader = req.headers['authorization'] as string;
    let bearerToken: string|undefined = undefined;

    if (bearerHeader !== undefined) {
        let bearer: string[] = bearerHeader.split(' ')
        bearerToken = bearer[1]
    }

    verifyToken(req.url, bearerToken ?? "").then((payload) => {
        if (payload !== undefined) {
            generateToken(payload).then((token) => {
                res.setHeader('Authorization', `Bearer ${token}`)
                next()
            }).catch((err) => {
                console.error(err)
            })
        }else{
            next()
        }
    }).catch((err) => {
        res.status(err.statusCode).json({ error: err.message })
    })

})

app.get('/v1', (req: Request, res: Response) => {
    res.send('Hello World From the Typescript Server!')
})

const port = process.env.PORT ?? 8000

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

app.use('/v1/users', users)
app.use('/v1/users', messages)
app.use(
    '/v1/docs/',
    swaggerUI.serve,
    swaggerUI.setup(swaggerDocs, { explorer: true })
)
