require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
// Import session and passport
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');

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
        mongoUrl: 'mongodb://127.0.0.1:27017/sessionDB',
        autoRemove: 'interval',
        autoRemoveInterval: 10 //10 minute
    })
}));

// Initialize passport and passport session
app.use(passport.initialize());
app.use(passport.session());

// Set up passport-local strategy
// Use .createStrategy() instead of .authenticate()
passport.use(User.createStrategy());

// Set serialize and deserialize user
// This is used to store the user in the session
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.route("/")
    .get((req, res) => {
        res.render('home');
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
        if (req.isAuthenticated()) {
            res.render('secrets');
        }
        else {
            res.redirect('/login');
        }
    });
(async () => {
    await db.connect('userSecretDB');
    app.listen(3000, () => console.log('Server started on port 3000'));
})().then(() => { console.log('Done'); });