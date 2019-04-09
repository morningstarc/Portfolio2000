const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy

const passwordcrypto = require('./passwordcrypto')

function config(app) {
    app.use(passport.initialize())
    app.use(passport.session())

    userSerialDeserial(app)

    const localLogin = new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true
        },
        (req, email, password, done) => {
            console.log('password strategy is called')
            app.locals.userCollection.find({
                    email
                }).toArray()
                .then(users => {
                    if (users.length != 1) {
                        console.log('passport invalid email !=1')
                        return done(null, false, req.flash('flash_message', 'invalid email'))
                    } else {
                        const user = users[0]
                        if (passwordcrypto.verifyPassword(password, user)) {
                            console.log('passport user validated')
                            return done(null, user)
                        } else {
                            console.log('passport password invalid')
                            return done(null, false, req.flash('flash_message', 'invalid password'))
                        }
                    }
                })
                .catch(error => {
                    console.log('find() db error')
                    return done(error)
                })
        }
    )

    passport.use('localLogin', localLogin)

    const signupStrategy = new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true
        },
        (req, email, password, done) => {
            app.locals.userCollection.find({email}).toArray()
                .then(users => {
                    if (users.length != 0) {
                        return done(null, false, req.flash('flash_message', 'Email already in use'))
                    } else {
                        const hashedPassword = passwordcrypto.hashPassword(password)
                        const user = {
                            email,
                            fullname: req.body.fullname,
                            password: hashedPassword
                        }
                        app.locals.customerCollection.insertOne(user)
                            .then(result => {
                                return done(null, user,
                                    req.flash('flash_message', 'Your account is created'))
                            })
                            .catch(error => {
                                return done(error)
                            })
                    }
                })
        }
    )
    passport.use('signupStrategy', signupStrategy)
}




function userSerialDeserial(app) {
    passport.serializeUser((user, done) => {
        done(null, user._id)
    })
    passport.deserializeUser((serial_user, done) => {
        app.locals.userCollection.find({
                _id: app.locals.ObjectID(serial_user)
            }).toArray()
            .then(users => {
                if (users.length != 1) {
                    throw `Error found ${users.length} users`
                } else {
                    done(null, users[0])
                }
            })
            .catch(error => {
                return done(error)
            })
    })
}

module.exports = {
    config,
    passport
}