require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const db = require('./dbUtils.js');
//const crypto = require('crypto');
const bcrypt = require('bcrypt');
const saltRounds = 10;


const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.route("/")
    .get((req, res) => {
        res.render('home');
    });
app.route("/login")
    .get((req, res) => {
        res.render('login');
    })
    .post((req, res) => {
        db.findUser(req.body.username)
            .then(user => {
                if (user) {
                    bcrypt.compare(req.body.password, user.password)
                        .then(result => {
                            if (result)
                                res.render('secrets');
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







(async () => {
    await db.connect('usedSecretDB');
    app.listen(3000, () => console.log('Server started on port 3000'));
})().then(() => { console.log('Done'); });