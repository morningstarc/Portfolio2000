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



//database
const database = require('./database.js');
database.startDBandApp(app, PORT);

//session
app.use(session({
    secret: 'reallysupersecretstring@#$77',
    saveUninitialized: false,
    resave: false,
}));

///Passport///
const passConfig = require('./passConfig.js');
passConfig.config(app);

const flash = require('connect-flash')
app.use(flash())


///ROUTES ///

app.get('/', (req, res) => {
    res.render('login', {
        flash_message: req.flash('flash_message')
    })
})

app.post('/login', passConfig.passport.authenticate(
    'localLogin', {
        successRedirect: '/home',
        failureRedirect: '/login',
        failureFlash: true
    }
))

app.get('/home', (req, res) => {
    res.render('home')
})

app.get('/logout', (req, res) => {
    req.logout()
    res.redirect('/')
})


/////AUTH /////

function auth(req, res, next) {
    const user = req.user
    if (!user) {
        res.render('401')
    } else {
        next()
    }
}
