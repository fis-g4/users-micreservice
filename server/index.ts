import express, { Express, Request, Response } from 'express'
import cors from 'cors'
import './loadEnvironment'
import users from './routes/users'
import './db/conn'
import { generateToken, verifyToken } from './utils/jwtUtils'

const app: Express = express()

app.use(express.json())
app.use(cors())

const URLS_ALLOWED_WITHOUT_TOKEN = ["/users/login", "/users/new"];

app.use((req, res, next) => {

    let decodedToken = verifyToken(req, res, URLS_ALLOWED_WITHOUT_TOKEN.includes(req.path));

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
