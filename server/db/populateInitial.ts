import { PlanType, User } from './models/user';
import bcrypt from 'bcrypt';

const SALT_ROUNDS: number = parseInt(process.env.SALT_ROUNDS || "10");
const POPULATE_DB_ON_EACH_RELOAD: boolean = process.env.RESET_DB_ON_EACH_RELOAD === "true" || false;
const salt = bcrypt.genSaltSync(SALT_ROUNDS);

function populateUsers() {
    User.build({
        firstName: 'Maria', 
        lastName: 'Doe',
        username: 'mariaDoe',
        password: bcrypt.hashSync('maria123', salt),
        email: 'maria@example.com',
        plan: PlanType.FREE,
    }).save();
    
    User.build({
        firstName: 'John',
        lastName: 'Doe',
        username: 'johnDoe',
        password: bcrypt.hashSync('john123', salt),
        email: 'juan@example.com',
        plan: PlanType.PREMIUM,
    }).save();
}

async function populateDB() {

    console.log('Populating DB...');
    
    if (process.env.NODE_ENV !== 'production') {

        User.collection.countDocuments().then((count) => {
            if (count === 0 || POPULATE_DB_ON_EACH_RELOAD) {
                User.collection.drop().then(()=>{
                    populateUsers()
                });
            }
        })
    }

    console.log('Populated!');
}

export default populateDB;