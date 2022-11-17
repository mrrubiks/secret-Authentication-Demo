const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');

exports.connect = async (dbName, options) => {
    if (options == null) {
        console.log('Connecting to local MongoDB...');
        await mongoose.connect(`mongodb://127.0.0.1:27017/${dbName}`)
            .catch(err => { console.log(err); throw err; });
        console.log('Connected to local MongoDB...');
    }
    else {
        console.log('Connecting to MongoDB Atlas...');
        await mongoose.connect(`mongodb+srv://${options.user}:${options.password}@cluster0.mvgwpdk.mongodb.net/todolistDB?retryWrites=true&w=majority`)
            .catch(err => { console.log(err); throw err; });
        console.log('Connected to MongoDB Atlas...');
    }
    mongoose.connection.on("error", console.error.bind(console, "connection error:"));
    return mongoose.connection;
}

exports.userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    }
});

exports.userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] });

exports.User = mongoose.model('User', exports.userSchema);

exports.addUser = async (email, password) => {
    let newUser = new exports.User({
        email: email,
        password: password
    });
    if (await exports.User.exists({ email: email }))
        return false;
    else
        return await newUser.save().catch(err => { console.log(err); throw err; });
}

exports.findUser = async (email) => {
    return await exports.User.findOne({ email: email }).catch(err => { console.log(err); throw err; });
}