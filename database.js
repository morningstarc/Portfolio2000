const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
const ObjectID = mongodb.ObjectID;
const username = 'user';
const password = 'password';
const dbHost = 'localhost';
const dbPort = 27017;
const dbName = 'wsp';
const dbURL = `mongodb://${username}:${password}@${dbHost}:${dbPort}/?authSource=${dbName}`;
//const dbURL = 'mongodb://user:password@localhost:27017/?authSource=wsp, { useNewUrlParser: true }';

let dbclient;

function startDBandApp(app, PORT) {
    MongoClient.connect(dbURL, {
            poolSize: 30,
            useNewURLParser: true
        })
        .then(client => {
            dbclient = client;
            usersCollection = client.db(dbName).collection("users");
            app.locals.usersCollection = usersCollection;
            app.locals.ObjectID = ObjectID;
            app.listen(PORT, () => {
                console.log(`Server is running at ${PORT}`);
            })

        })
        .catch(err => {
            console.log('DB connecton error: ', err)
        });
}

process.on('SIGINT', () => {
    dbclient.close();
    console.log('db connection closed by SIGINT')
    process.exit();
})

module.exports = {
    startDBandApp,
    ObjectID,
};