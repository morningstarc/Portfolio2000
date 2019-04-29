const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;
const ObjectID = mongodb.ObjectID;
const username = "user";
const password = "password";
const dbName = "wsp";
const dbHost = "localhost";
const dbPort = 27017;
const usersCollectionName = "users";
const projectsCollectionName = "projects";
const messagesCollectionName = "messages";

const dbURL = `mongodb://${username}:${password}@${dbHost}:${dbPort}?authSource=${dbName}`;

let dbclient;
let usersCollection;
let projectsCollection;
let messagesCollection;


function startDBandApp(app, PORT) {
    MongoClient.connect(dbURL, {
            poolSize: 30,
            useNewUrlParser: true
        })
        .then(client => {
            dbclient = client;
            usersCollection = client.db(dbName).collection(usersCollectionName);
            app.locals.usersCollection = usersCollection;
            projectsCollection = client.db(dbName).collection(projectsCollectionName);
            app.locals.projectsCollection = projectsCollection;
            messagesCollection = client.db(dbName).collection(messagesCollectionName);
            app.locals.messagesCollection = messagesCollection;
            app.locals.ObjectID = ObjectID;
            app.listen(PORT, () => {
                console.log(`Server is running at port ${PORT}`);
            });
        })
        .catch(error => {
            console.log("db connection error:", error);
        });
}

process.on("SIGINT", () => {
    dbclient.close();
    console.log("db connection closed by SIGINT")
    process.exit();
});

module.exports = {
    startDBandApp,
    ObjectID,
    usersCollection,
    projectsCollection
};