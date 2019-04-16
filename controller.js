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


//Home
app.get('/', (req, res) => {
    res.render('blank', { user: req.user })
  
})

app.get('/home', (req, res) => {
    res.render('blank', { user: req.user })
})

//Login
app.get('/login', (req, res) => {
    const user = req.user;
    if (!user) {
        res.render('login', {
            flash_message: req.flash('flash_message')
        })
    } else {
        res.render('login', {
            flash_message: req.flash('flash_message'), user
        })
    }
})
app.post('/login', accountConfig.passport.authenticate(
    'localLogin', {
        successRedirect: '/home',
        failureRedirect: '/login',
        failureFlash: true
    }
))

app.get('/logout', (req, res) => {
    req.logout()
    res.redirect('/')
});

//Projects

app.get('/projects', (req, res) => {
    app.locals.projectsCollection.find({user: req.user._id}).toArray()
        .then(projects => {
            res.render('projects', {projects, user: req.user})
        })
        .catch(error => {
          console.log(error)
         })
});

app.get('/uploadProject', auth, (req, res) => {
    res.render('uploadProject', {user: req.user})
});

app.post('/uploadProject', auth, (req, res) => {
    //upload to database
    const project = {
        user: req.user._id,
        name: req.body.title,
        type: req.body.type,
        github: req.body.github,
        link: req.body.link,
        code: req.body.code
    };

    app.locals.projectsCollection.insertOne(project)
        .then(result => {
            res.redirect('home')
        })
        .catch(error => {
            res.render('errorPage', {
                message: 'project failed to upload to db'
            })
        })
})

//Profile
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
    app.locals.usersCollection.updateOne(query, newValue)
        .then(result => {
            res.redirect('/')
        })
        .catch(error => {
            //error
        })
});

app.post('/delete', auth, (req, res) => {
    const _id = req.body._id

    const query = {_id: app.locals.ObjectID(_id)}
    req.logout();
    app.locals.usersCollection.deleteOne(query)
        .then(result => {
            res.redirect('/')
        })
        .catch(error => {
            //error
        })
});

//Registration
app.get('/register', (req, res) => {
    res.render('register', {flash_message: req.flash("flash_message")});
});

app.post('/register', accountConfig.passport.authenticate(
    'signupStrategy',
    {successRedirect: '/', failureRedirect: '/register', failureFlash: true}
));

//Admin Features
app.get('/userList', adminAuth, (req, res) => {
    app.locals.usersCollection.find({}).toArray()
        .then(users => {
            res.render('userList', {users, user: req.user})
        })
        .catch(error => {
          console.log(error)
         })
});

app.post('/adminDelete', adminAuth, (req, res) => {
    const _id = req.body._id

    const query = {_id: app.locals.ObjectID(_id)}
    app.locals.usersCollection.deleteOne(query)
        .then(result => {
            res.redirect('/userList')
        })
        .catch(error => {
            //error
        })
});



/////AUTH /////

function auth(req, res, next) {
    const user = req.user
    if (!user) {
        res.render('401')
    } else {
        next()
    }
}

function adminAuth(req, res, next) {
    const user = req.user;
    if (!user || !user.admin) {
        res.render("401");
    } else {
        next();
    }
}
