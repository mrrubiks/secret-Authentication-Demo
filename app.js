require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const ejs = require('ejs');
const db = require('./dbUtils.js');
const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        //60 seconds
        maxAge: 60000
    },
    store: MongoStore.create({ mongoUrl: 'mongodb://127.0.0.1:27017/sessionDB' })
}));


app.route("/")
    .get((req, res) => {
        res.render('home');
    });
app.route("/login")
    .get((req, res) => {
        if (req.session.loggedIn)
            res.redirect('secrets');
        else
            res.render('login');
    })
    .post((req, res) => {
        const email = req.body.username;
        const password = req.body.password;
        db.findUser(email).then(user => {
            if (user) {
                if (user.password === password) {
                    req.session.loggedIn = true;
                    req.session.email = email;
                    res.redirect('/secrets');
                }
                else
                    res.redirect('/login');
            }
            else
                res.redirect('/login');
        });
    });



app.route("/register")
    .get((req, res) => {
        if (req.session.loggedIn)
            res.redirect('/secrets');
        else
            res.render('register');
    })
    .post((req, res) => {
        const email = req.body.username;
        const password = req.body.password;
        db.findUser(email).then(user => {
            if (user)
                res.redirect('login');
            else {
                db.addUser(email, password).then(user => {
                    if (user) {
                        req.session.loggedIn = true;
                        req.session.email = email;
                        res.redirect('/secrets');
                    }
                    else
                        res.redirect('/register');
                });
            }
        });
    });

app.route("/logout")
    .get((req, res) => {
        req.session.destroy(err => {
            if (err)
                console.log(err);
            else
                res.redirect('/');
        });
    });

app.route("/secrets")
    .get((req, res) => {
        if (req.session.loggedIn) {
            res.render('secrets');
            console.log(req.session.cookie.expires);
        }
        else
            res.redirect('login');
    });






(async () => {
    await db.connect('usedSecretDB');
    app.listen(3000, () => console.log('Server started on port 3000'));
})().then(() => { console.log('Done'); });