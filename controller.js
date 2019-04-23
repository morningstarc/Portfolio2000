const express = require('express');
const app = express();
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const accountConfig = require('./accountConfig');
const passwordcrypto = require("./passwordHash.js");
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

app.use(function (req, res, next) {
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    next();
});

accountConfig.config(app);

app.use(flash())



//Multer for Images
const multer = require('multer')
const path = require('path')

const MAX_FILESIZE = 1020 * 1024 * 1 // 1MB
const fileTypes = /jpeg|jpg|png|gif/ //regex

const storageOptions = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, './public/img')
    },
    filename: (req, file, callback) => {
        callback(null, 'image' + Date.now() + path.extname(file.originalname))
    }
})

const imageUpload = multer({
    storage: storageOptions,
    limits: {
        fileSize: MAX_FILESIZE
    },
    fileFilter: (req, file, callback) => {
        const ext = fileTypes.test(path.extname(file.originalname).toLowerCase())
        const mimetype = fileTypes.test(file.mimetype)
        if (ext && mimetype) {
            return callback(null, true)
        } else {
            return callback('Error: Images (Type: jpeg, jpg, png, gif) only')
        }
    }
}).single('imageButton')




///ROUTES ///

//Home
app.get('/', (req, res) => {
    res.render('blank', { user: req.user })
  
})

app.get('/home', (req, res) => {
    app.locals.projectsCollection.find().toArray()
        .then(projects => {
            res.render('home', { projects, user: req.user })
        })
        .catch(error => {
            console.log(error)
        })
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
    res.redirect('/login')
});

//Search
app.get('/searchCode', (req, res) => {
    const kw = req.query._kw
    app.locals.projectsCollection.find({type: kw}).toArray()
        .then(projects => {
            res.render('home', { projects, user: req.user })
        })
        .catch(error => {
            console.log(error)
        })
})

//Projects

app.get('/projects', (req, res) => {
    const _id = req.query._id;
    const query = database.ObjectID(_id)
    app.locals.projectsCollection.find({user: query}).toArray()
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
        description: req.body.description
    };

    app.locals.projectsCollection.insertOne(project)
        .then(result => {
            app.locals.projectsCollection.find({user: req.user._id}).toArray()
                .then(projects => {
                    res.render('projects', {projects, user: req.user })
                })
                .catch(error => {
                    console.log(error)
                })
        })
        .catch(error => {
            res.render('errorPage', {message: 'project failed to upload to db'})
        })
        
})

app.post('/deleteProject', (req, res) => {
    const _id = req.body._id;

    const delquery = {_id: database.ObjectID(_id)};

    app.locals.projectsCollection.deleteOne(delquery)
        .then(result => {
            app.locals.projectsCollection.find({
                    user: req.user._id
                }).toArray()
                .then(projects => {
                    res.render('projects', {projects, user: req.user})
                })
                .catch(error => {
                    console.log(error)
                })
        })
        .catch(error => {
            res.render('errorPage', {
                source: '/deleteProject(POST)',
                error
            })
        })

});

app.get('/updateProject', (req, res) => {
     const _id = req.body._id
     app.locals.projectsCollection.find({_id: database.ObjectID(_id)}).toArray()
         .then(projects => {
             if (projects.length != 1) {
                 throw `Found ${projects.length} projects for EDIT`
             }
             res.render("updateProject", {project: projects[0], user: req.user})
         })
         .catch(error => {console.log(error)});
})

app.post('/updateProject', auth, (req, res) => {
    const _id = req.body._id
    const name = req.body.title
    const type = req.body.type
    const github = req.body.github
    const link = req.body.link
    const description = req.body.description
    const newValue = {$set: {name, type, github, link, description}}
    const query = {_id: app.locals.ObjectID(_id)}
    app.locals.projectsCollection.updateOne(query, newValue)
        .then(result => {
            
             app.locals.projectsCollection.find({user: req.user._id}).toArray()
                 .then(projects => {
                     res.render('projects', {projects, user: req.user})
                 })
                 .catch(error => {
                     console.log(error)
                 })
        })
        .catch(error => {error })
});

//Profile
app.get('/user', (req, res) => {
    const _id = req.query._id
    app.locals.usersCollection.find({_id: database.ObjectID(_id)}).toArray()
        .then(foundUsers => {
            if (foundUsers.length != 1) {
                throw `Found ${foundUsers.length} users for EDIT`
            }
            if(req.user){
                res.render("user", {fu: foundUsers[0], user: req.user})
            }else{
                res.render("user", {fu: foundUsers[0]})
            }
        })
        .catch(error => {console.log(error)});
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
    app.locals.usersCollection.updateOne(query, newValue)
        .then(result => {
            res.redirect('/user')
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

/////FILE UPLOAD & IMAGE ////////
app.post('/imageUpload', auth, (req, res) => {
    imageUpload(req, res, error => {
        if (error) {
            return res.render('errorPage', {
                message: error
            })
        } else if (!req.file) {
            return res.render('errorPage', {
                message: 'No file selected'
            })
        }

        //upload to database
        const image = {
            filename: req.file.filename,
            size: req.file.size
        }
        const newValue = { $set: { image } }
        const _id = req.user._id;
        const query = {
            _id: app.locals.ObjectID(_id)
        }
        app.locals.usersCollection.findOneAndUpdate(query, newValue)
            .then(result => {
                res.render('updateProfile', { user: req.user })
            })
            .catch(error => {
                res.render('errorPage', {
                    message: 'image failed uploading to DB'
                })
            })
    })
})



const fs = require('fs')

app.post('deleteImage', auth, (req, res) => {
    app.locals.imageCollection.deleteOne({
            _id: app.locals.ObjectID(req.body._id)
        })
        .then(result => {
            const filename = req.body.filename
            fs.unlink('./public/images/' + filename, (error) => {
                if (error) {
                    res.render('admin/errorPage', {
                        message: 'cant delete image'
                    })
                } else {
                    res.redirect('/admin/home')
                }
            })
        })
        .catch(error => {
            res.render('admin/errorPage', {
                message: 'error deleting image DB'
            })
        })
})

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

app.post('/adminResetPassword', adminAuth, (req, res) => {
    const _id = req.body._id
    
    const newValue = {$set: {password: passwordcrypto.hashPassword("password")}}
    const query = {_id: app.locals.ObjectID(_id)}

    app.locals.usersCollection.updateOne(query, newValue)
        .then(result => {
            res.redirect('/home')
        })
        .catch(error => {
            //error
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
