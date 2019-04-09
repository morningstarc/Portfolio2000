const express = require('express');
const app = express();
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const accountConfig = require('./accountConfig');
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

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.isAuthenticated();
    next();
})

app.use(flash());

accountConfig.config(app);

//database
const database = require('./database.js');
database.startDBandApp(app, PORT);


//Routes

app.get('/users', (req, res) => {
    res.render('users', {user: req.user})
});

app.get('/projects', (req, res) => {
    res.render('projects', {user: req.user})
});

app.get('/updateProfile', (req, res) => {
        const _id = req.query._id
        app.locals.usersCollection.find({_id: database.ObjectID(_id)}).toArray()
            .then(users => {
                if (users.length != 1) {
                    throw `Found ${users.length} users for EDIT`
                }
                res.render("updateProfile", {user: users[0]})
            })
            .catch(error => {
                //res.render("errorPage", {source: "/admin/update", error})
            });
});

app.post('/updateProfile', auth, (req, res) => {
    const _id = req.body._id
    const firstname = req.body.firstname
    const lastname = req.body.lastname

    const query = {_id: app.locals.ObjectID(_id)}
    const newValue = {$set: {firstname, lastname}}

    app.locals.usersCollection.updateOne(query, newValue)
        .then(result => {
            res.redirect("/")
        })
        .catch(error => {
            //error
        })
});

app.get('/register', (req, res) => {
    res.render('register', {flash_message: req.flash("flash_message")});
});

app.post('/register', accountConfig.passport.authenticate(
    'signupStrategy',
    {successRedirect: '/', failureRedirect: '/register', failureFlash: true}
));

app.get('/', (req, res) => {
    const user = req.user
    if (!user) {
        res.render('home')
    } else {
        res.render('home', {user})
    }
});

//Utility functions
function auth(req, res, next) {
    const user = req.user;
    if (!user) {
        //res.render("401");
    } else {
        next();
    }
}