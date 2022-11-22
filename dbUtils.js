const mongoose = require('mongoose');

exports.connect = async (dbName, options) => {
    if (options == null) {
        console.log('Connecting to local MongoDB...');
        await mongoose.connect(`mongodb://127.0.0.1:27017/${dbName}`)
            .catch(err => { console.log(err); throw err; });
        console.log('Connected to local MongoDB...');
    }
    else {
        console.log('Connecting to MongoDB Atlas...');
        await mongoose.connect(`mongodb+srv://${options.user}:${options.password}@cluster0.mvgwpdk.mongodb.net/${dbName}?retryWrites=true&w=majority`)
            .catch(err => { console.log(err); throw err; });
        console.log('Connected to MongoDB Atlas...');
    }
    mongoose.connection.on("error", console.error.bind(console, "connection error:"));
    return mongoose.connection;
}

const secretSchema = new mongoose.Schema({
    secret: {
        type: String,
        required: true
    }
});

exports.Secret = mongoose.model('Secret', secretSchema);
