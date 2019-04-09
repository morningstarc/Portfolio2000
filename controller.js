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
accountConfig.config(app);
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.isAuthenticated();
    next();
})

accountConfig.config(app);

app.use(flash())


///ROUTES ///

app.get('/', (req, res) => {
    res.render('login', {
        flash_message: req.flash('flash_message')
    })
})

app.post('/login', accountConfig.passport.authenticate(
    'localLogin', {
        successRedirect: '/home',
        failureRedirect: '/login',
        failureFlash: true
    }
))

// app.get('/projects', (req, res) => {
//     res.render('projects', {user: req.user})
// })

app.get('/home', (req, res) => {
    res.render('home', {user: req.user})
})

app.get('/logout', (req, res) => {
    req.logout()
    res.redirect('/')
});

app.get('/upload', auth, (req, res) => {
    res.render('upload', {user: req.user})
});

app.get('/updateProfile', (req, res) => {
        const _id = req.query._id
        app.locals.usersCollection.find({_id: database.ObjectID(_id)}).toArray()
            .then(users => {
                if (users.length != 1) {
                    throw `Found ${users.length} users for EDIT`
                }
                res.render("updateProfile", {user: users[0]})
                //res.render("errorPage", {source: "/admin/update", error})
            })
            .catch(error => {
            });
});

app.post('/updateProfile', auth, (req, res) => {
    const _id = req.body._id
    const firstname = req.body.firstname
    const lastname = req.body.lastname

    const newValue = {$set: {firstname, lastname}}
    const query = {_id: app.locals.ObjectID(_id)}

        .then(result => {
    app.locals.usersCollection.updateOne(query, newValue)
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
app.post('/upload', auth, (req, res) => {
        //upload to database
    const project = {
        user: req.user._id,
        name: req.body.title,
        type: req.body.type,
        github: req.body.github,
        link: req.body.link,
        code: req.body.code
    };
    
    app.locals.projectCollection.insertOne(project)
        .then(result => {
            res.redirect('home')
        })
        .catch(error => {
            res.render('errorPage', {
                message: 'project failed to upload to db'
            })
    })
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
