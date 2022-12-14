require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
// Import session and passport
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const googleStrategy = require('passport-google-oauth20').Strategy;
const githubStrategy = require('passport-github2').Strategy;

const db = require('./dbUtils.js');
const User = require('./user.js').User;

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));

// Use session middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 //1 minute
    },
    store: MongoStore.create({
        mongoUrl: process.env.NODE_ENV === 'production' ? process.env.MONGODBATLAS_SESSION_URL
            : 'mongodb://127.0.0.1:27017/sessionDB',
        autoRemove: 'interval',
        autoRemoveInterval: 10 //10 minute
    })
}));

// Initialize passport and passport session
app.use(passport.initialize());
app.use(passport.session());


// Set serialize and deserialize user
// This is used to store the user in the session

// Serialize user to the session
// req.session.passport.user = user.id
passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, user.id);
    });
});

// The User.serializeUser() will serialize the username field to the session
// It's not ideal to seraialize the username
// It's better to serialize the id, because the id is unique and indexed
//passport.serializeUser(User.serializeUser());

// Deserialize user from the session
// req.user = {username: 'xxx', provider: 'xxx', ...}
passport.deserializeUser(function (user, cb) {
    process.nextTick(function () {
        User.findById(user, function (err, user) {
            return cb(err, user);
        });
    });
});

// The User.deserializeUser() will retrieve the whole user object from the database and attach it to the request object as req.user
//passport.deserializeUser(User.deserializeUser());

// Set up passport-local strategy
// Use .createStrategy() instead of .authenticate()
passport.use(User.createStrategy());

// Set up passport-google-oauth20 strategy
passport.use(new googleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
},
    function verify(accessToken, refreshToken, profile, cb) {
        User.findOne({
            'google.id': profile.id
        }, function (err, user) {
            if (err) {
                return cb(err);
            }
            //No user was found... 
            if (!user) {
                console.log("No user found, creating new user");
                user = new User({
                    username: profile.displayName,
                    provider: 'google',
                    email: profile.emails[0].value,
                    photo: profile.photos[0].value,
                    //now in the future searching on User.findOne({'google.id': profile.id } will match because of this next line
                    google: profile
                });
                user.save(function (err) {
                    if (err) console.log(err);
                    return cb(null, user);
                });
            } else {
                console.log("User found, logging in");
                //found user. Return
                return cb(null, user);
            }
        });
    }
));

// Set up passport-github2 strategy
passport.use(new githubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL
},
    function verify(accessToken, refreshToken, profile, cb) {
        User.findOne({
            'github.id': profile.id
        }, function (err, user) {
            if (err) {
                return cb(err);
            }
            if (!user) {
                console.log("No user found, creating new user");
                user = new User({
                    username: profile.displayName,
                    provider: 'github',
                    email: profile.emails[0].value,
                    photo: profile.photos[0].value,
                    github: profile
                });
                user.save(function (err) {
                    if (err) console.log(err);
                    return cb(null, user);
                });
            } else {
                console.log("User found, logging in");
                return cb(null, user);
            }
        });
    }
));




app.route("/")
    .get((req, res) => {
        res.render('home');
    });

app.route("/auth/:provider")
    .get((req, res, next) => {
        passport.authenticate(req.params.provider, {
            scope: ['profile', 'email']
        })(req, res, next);
    });

app.route("/auth/:provider/callback")
    .get((req, res, next) => {
        passport.authenticate(req.params.provider, {
            successRedirect: '/secrets',
            failureRedirect: '/login'
        })(req, res, next);
    });


app.route("/login")
    .get((req, res) => {
        if (req.isAuthenticated()) {
            res.redirect('/secrets');
        }
        else {
            res.render('login');
        }
    })
    .post(passport.authenticate('local', { failureRedirect: '/login', successRedirect: '/secrets' }));



app.route("/register")
    .get((req, res) => {
        if (req.isAuthenticated()) {
            res.redirect('/secrets');
        }
        else {
            res.render('register');
        }
    })
    .post((req, res) => {
        const username = req.body.username;
        const password = req.body.password;
        // Register user
        User.register({ username: username }, password)
            .then(() => {
                // Authenticate user
                // Use .authenticate() instead of .login() 
                // The docs recomends using .authenticate() instead of .login() when registering a new user
                passport.authenticate('local', { failureRedirect: '/register' })(req, res, () => {
                    res.redirect('/secrets');
                });
                // After registering and authenticating the new user, the loggin in process is done automatically
            })
            .catch(err => {
                console.log(err);
                res.redirect('/register');
            });
    });

app.route("/logout")
    .get((req, res) => {
        req.logout((err) => {
            if (err) {
                console.log(err);
                res.redirect('/');
            }
            else {
                req.session.destroy();
                res.redirect('/');
            }
        });
    });

app.route("/secrets")
    .get((req, res) => {
        // console.log(req.session.passport.user);
        // console.log(req.user);
        if (req.isAuthenticated()) {
            db.Secret.find()
                .then(secrets => {
                    res.render('secrets', { secrets: secrets });
                })
                .catch(err => {
                    console.log(err);
                });
        }
        else {
            res.redirect('/login');
        }
    });

app.route("/submit")
    .get((req, res) => {
        if (req.isAuthenticated()) {
            res.render('submit');
        }
        else {
            res.redirect('/login');
        }
    })
    .post((req, res) => {
        if (req.isAuthenticated()) {
            const submittedSecret = new db.Secret({
                secret: req.body.secret
            });
            submittedSecret.save();
            req.user.secret.push(submittedSecret._id);
            req.user.save()
                .then(() => {
                    res.redirect('/secrets');
                })
                .catch(err => {
                    console.log(err);
                    res.redirect('/submit');
                });
        }
        else {
            res.redirect('/login');
        }
    });


(async () => {
    if (process.env.NODE_ENV !== 'production') {
        await db.connect('userSecretDB');
    }
    else {
        await db.connect('userSecretDB', { user: process.env.MONGODBATLAS_USR, password: process.env.MONGODBATLAS_PSW });
    }
    app.listen(process.env.PORT || 3000, () => console.log(`Server started on port ${process.env.PORT || 3000}`));
})().then(() => { console.log('Done'); });