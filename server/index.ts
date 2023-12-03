import express, { Express, Request, Response } from 'express'
import cors from 'cors'
import './loadEnvironment'
import users from './routes/users'
import messages from './routes/messages'
import './db/conn'
import { generateToken, verifyToken } from './utils/jwtUtils'
import swaggerjsdoc from 'swagger-jsdoc';
import swaggerui from 'swagger-ui-express';

const app: Express = express()

app.use(express.json())
app.use(cors())

const URLS_ALLOWED_WITHOUT_TOKEN = ["/users/login", "/users/new", "/docs/*"];

const swaggerJsDoc = swaggerjsdoc;
const swaggerUI = swaggerui;

const swaggerOptions = {
    definition: {
        openapi: '3.1.0',
        info: {
            version: "1.0.0",
            title: "API Microservicio Usuarios", 
            description: "API del microservicio de usuarios para la asignatura de Fundamentos de Ingeniería del Software.",
            contact: [
                {
                    name: "Francisco Javier Cavero López",
                    email: "fcavero@us.es",
                    url: "https://github.com/javiercavlop"
                },
                {
                    name: "Alejandro García Fernández",
                    email: "agarcia29@us.es",
                    url: "https://github.com/Alex-GF"
                },
            ],
            license: {
                name: "MIT",
                url: "https://opensource.org/licenses/MIT"
            }
        },
        servers: [process.env.BASE_URL ?? "http://localhost:8000"]
    },
    basePath: "/",
    apis: ["./routes/*.js"]
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

function isURLAllowedWithoutToken(url: string): boolean {
    if(URLS_ALLOWED_WITHOUT_TOKEN.includes(url)){
        return true;
    }
    for(let urlAllowed of URLS_ALLOWED_WITHOUT_TOKEN){
        if(urlAllowed.endsWith("/*") && (url.startsWith(urlAllowed.substring(0, urlAllowed.length - 1)) || url === urlAllowed.substring(0, urlAllowed.length - 2))){
            return true;
        }
    }
    return false;
}

app.use((req, res, next) => {

    let decodedToken = verifyToken(req, res, isURLAllowedWithoutToken(req.url));

    if (decodedToken !== undefined) {
        // Agregar el nuevo token al encabezado de la respuesta
        res.setHeader('Authorization', `Bearer ${generateToken(decodedToken as object, res)}`);
    }else if(res.statusCode !== 200){
        return res;
    }

    next();
  });

app.get('/', (req: Request, res: Response) => {
    res.send('Hello World From the Typescript Server!')
})

const port = process.env.PORT ?? 8000

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

app.use('/users', users)
app.use('/users', messages)
app.use('/docs/', swaggerUI.serve, swaggerUI.setup(swaggerDocs, { explorer: true }));