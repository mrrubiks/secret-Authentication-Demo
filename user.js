const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    }
});

userSchema.plugin(passportLocalMongoose);

exports.User = mongoose.model('User', userSchema);