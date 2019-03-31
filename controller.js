const express = require('express');
const app = express();
const session = require('express-session');
const PORT = process.env.PORT || 3000;

//EJS Template Views
app.set('view engine', 'ejs');
app.set('views', './views');
//Middleware
app.use('/public', express.static(__dirname + '/public'));
app.use(express.urlencoded({
    extended: false
}));

app.use(session({
    secret: 'reallysupersecretstring@#$77',
    saveUninitialized: false,
    resave: false,
}));

//database
const database = require('./database.js');
database.startDBandApp(app, PORT);


//Routes

app.get('/users', (req, res) => {
    res.render('users')
});

app.get('/projects', (req, res) => {
    res.render('projects')
});

app.get('/', (req, res) => {
    res.render('home')
});