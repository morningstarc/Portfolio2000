const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;
const ObjectID = mongodb.ObjectID;
const username = "user";
const password = "password";
const dbName = "wsp";
const dbHost = "localhost";
const dbPort = 27017;
const userCollectionName = "users";
const projectCollectionName = "projects";

const dbURL = `mongodb://${username}:${password}@${dbHost}:${dbPort}?authSource=${dbName}`;

let dbclient;
let userCollection;
let projectCollection;


function startDBandApp(app, PORT) {
    MongoClient.connect(dbURL, {
            poolSize: 30,
            useNewUrlParser: true
        })
        .then(client => {
            dbclient = client;
            userCollection = client.db(dbName).collection(userCollectionName);
            app.locals.userCollection = userCollection;
            projectCollection = client.db(dbName).collection(projectCollectionName);
            app.locals.projectCollection = projectCollection;
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
    userCollection,
    projectCollection
};