import { User } from './models/user';

function populateUsers() {
    User.build({
        firstName: 'Maria', 
        lastName: 'Doe',
        username: 'mariaDoe',
        password: 'maria123',
        email: 'maria@example.com',
    }).save();
    
    User.build({
        firstName: 'John',
        lastName: 'Doe',
        username: 'johnDoe',
        password: 'john123',
        email: 'juan@example.com',
    }).save();
}

async function populateDB() {

    console.log('Populating DB...');
    
    if (process.env.NODE_ENV !== 'production') {

        User.collection.countDocuments().then((count) => {
            if (count === 0) {
                populateUsers()
            }
        })
    }

    console.log('Populated!');
}

export default populateDB;