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

const URLS_ALLOWED_WITHOUT_TOKEN = [
    '/v1/users/login',
    '/v1/users/new',
    '/v1/docs/*',
    '/v1',
]

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

function isURLAllowedWithoutToken(url: string): boolean {
    if (URLS_ALLOWED_WITHOUT_TOKEN.includes(url)) {
        return true
    }
    for (let urlAllowed of URLS_ALLOWED_WITHOUT_TOKEN) {
        if (
            urlAllowed.endsWith('/*') &&
            (url.startsWith(urlAllowed.substring(0, urlAllowed.length - 1)) ||
                url === urlAllowed.substring(0, urlAllowed.length - 2))
        ) {
            return true
        }
    }
    return false
}

app.use((req, res, next) => {

    let bearerHeader = req.headers['authorization'] as string;
    let bearer: string[] = bearerHeader.split(' ')
    let bearerToken: string = bearer[1]

    verifyToken(req.url, bearerToken).then((payload) => {
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
        console.error(err)
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
