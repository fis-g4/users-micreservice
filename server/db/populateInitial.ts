import { PlanType, User, UserRole } from './models/user'
import bcrypt from 'bcrypt'

const SALT_ROUNDS: number = parseInt(process.env.SALT_ROUNDS ?? '10')
const POPULATE_DB_ON_EACH_RELOAD: boolean =
    process.env.RESET_DB_ON_EACH_RELOAD === 'true'
const salt = bcrypt.genSaltSync(SALT_ROUNDS)

const bucketUrl = process.env.GCS_BUCKET_URL ?? ''
const bucketName = process.env.GCS_BUCKET_NAME ?? ''

function populateUsers() {
    User.build({
        firstName: 'Maria',
        lastName: 'Doe',
        username: 'mariaDoe',
        password: bcrypt.hashSync('maria1234', salt),
        email: 'maria@example.com',
        profilePicture: bucketUrl + '/' + bucketName + '/default-user.jpg',
        coinsAmount: 0,
        plan: PlanType.BASIC,
        role: UserRole.USER,
    }).save()

    User.build({
        firstName: 'John',
        lastName: 'Doe',
        username: 'johnDoe',
        password: bcrypt.hashSync('john1234', salt),
        email: 'juan@example.com',
        profilePicture: bucketUrl + '/' + bucketName + '/default-user.jpg',
        coinsAmount: 100,
        plan: PlanType.ADVANCED,
        role: UserRole.USER,
    }).save()
}

function populateAdmins() {
    User.build({
        firstName: 'Admin',
        lastName: 'User',
        username: process.env.ADMIN_USERNAME ?? 'admin',
        password: bcrypt.hashSync(
            process.env.ADMIN_PASSWORD ?? 'password',
            salt
        ),
        email: process.env.ADMIN_EMAIL ?? 'admin@example.com',
        profilePicture: bucketUrl + '/' + bucketName + '/default-user.jpg',
        coinsAmount: 99999,
        plan: PlanType.PRO,
        role: UserRole.ADMIN,
    }).save()

    User.build({
        firstName: 'Courses',
        lastName: 'Admin User',
        username: process.env.COURSES_SERVICE_USERNAME ?? '',
        password: bcrypt.hashSync(
            process.env.COURSES_SERVICE_PASSWORD ?? '',
            salt
        ),
        email: 'coursesadmin@example.com',
        profilePicture: bucketUrl + '/' + bucketName + '/default-user.jpg',
        coinsAmount: 99999,
        plan: PlanType.PRO,
        role: UserRole.ADMIN,
    }).save()

    User.build({
        firstName: 'Payments',
        lastName: 'Admin User',
        username: process.env.PAYMENT_SERVICE_USERNAME ?? '',
        password: bcrypt.hashSync(
            process.env.PAYMENT_SERVICE_PASSWORD ?? '',
            salt
        ),
        email: 'paymentadmin@example.com',
        profilePicture: bucketUrl + '/' + bucketName + '/default-user.jpg',
        coinsAmount: 99999,
        plan: PlanType.PRO,
        role: UserRole.ADMIN,
    }).save()
}

async function populateDB() {
    if (process.env.NODE_ENV !== 'production') {
        User.collection.countDocuments().then((count) => {
            if (count === 0 || POPULATE_DB_ON_EACH_RELOAD) {
                console.log('Populating DB with example users...')

                User.collection.drop().then(() => {
                    populateUsers()
                    console.log('Populated!')
                })
            }

            User.find({ role: UserRole.ADMIN })
                .countDocuments()
                .then((count) => {
                    if (count === 0 || POPULATE_DB_ON_EACH_RELOAD) {
                        console.log('Populating DB with admin users...')
                        populateAdmins()
                        console.log('Populated!')
                    }
                })
        })
    } else {
        User.deleteMany({ role: UserRole.ADMIN }).then(() => {
            console.log('Populating DB with admin users...')
            populateAdmins()
            console.log('Populated!')
        })
    }
}

export default populateDB
