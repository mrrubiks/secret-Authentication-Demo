require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const db = require('./dbUtils.js');
const crypto = require('crypto');

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
        const passwordHash = crypto.createHash('sha256').update(req.body.password).digest('base64');
        db.findUser(req.body.username)
            .then(user => {
                if (user) {
                    if (user.password === passwordHash)
                        res.render('secrets');
                    else
                        res.send('Incorrect password');
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
        const passwordHash = crypto.createHash('sha256').update(req.body.password).digest('base64');
        db.addUser(email, passwordHash)
            .then((result) => {
                if (result)
                    res.render('secrets'); //new user created
                else
                    res.render('register'); //already registered
            })
    });







(async () => {
    await db.connect('usedSecretDB');
    app.listen(3000, () => console.log('Server started on port 3000'));
})().then(() => { console.log('Done'); });