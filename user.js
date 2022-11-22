const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: String,
    photo: String,
    secret: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Secret'
    },
    provider: { // google, facebook, local
        type: String,
        default: 'local',
        required: true
    },
    google: Object,
    github: Object,
});

userSchema.plugin(passportLocalMongoose);

exports.User = mongoose.model('User', userSchema);