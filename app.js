require('dotenv').config();
const bcrypt = require('bcrypt');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const ejs = require('ejs');
const db = require('./dbUtils.js');


const saltRounds = 10;


const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));


app.get("/setcookie", (req, res) => {
    res.cookie("name", "value");
    res.cookie("name2", "value2");
    res.send("Cookie set");
});


app.route("/")
    .get((req, res) => {
        res.render('home');
    });
app.route("/login")
    .get((req, res) => {
        if (req.cookies.loggedIn)
            res.render('secrets');
        else
            res.render('login');
    })
    .post((req, res) => {
        db.findUser(req.body.username)
            .then(user => {
                if (user) {
                    bcrypt.compare(req.body.password, user.password)
                        .then(result => {
                            if (result) {
                                res.cookie("loggedIn", true);
                                res.render('secrets');
                            }
                            else
                                res.send('Incorrect password');
                        })
                }
                else
                    res.send('User not found');
            })
            .catch(err => { console.log(err); throw err; });
    });



app.route("/register")
    .get((req, res) => {
        res.render('register');
    })
    .post((req, res) => {
        const email = req.body.username;
        bcrypt.hash(req.body.password, saltRounds).then(passwordHash => {
            db.addUser(email, passwordHash)
                .then((result) => {
                    if (result)
                        res.render('secrets'); //new user created
                    else
                        res.render('register'); //already registered
                })
        });
    });

app.route("/logout")
    .get((req, res) => {
        res.clearCookie("loggedIn");
        res.redirect("/");
    });






(async () => {
    await db.connect('usedSecretDB');
    app.listen(3000, () => console.log('Server started on port 3000'));
})().then(() => { console.log('Done'); });