const mongoose = require("mongoose");

// Define user schema
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ""
    },
    avatar: {
        data: Buffer,
        contentType: String
    },
    stats: {
        followers: {
            type: [String],
            default: []
        },
        following: {
            type: [String],
            default: []
        }
    },
    images: [{
        data: Buffer,
        contentType: String
    }],
    viewedPostIDs: [String]

});

// Define image schema
const postsSchema = new mongoose.Schema({
    username: String, // Assuming you want an array of usernames
    posts: [{
        data: Buffer,
        contentType: String,
        id: Number,
        views: [String],
        likes: [String],
        shares: [String],
        comments: [{
            username: String, comments: String
        }]
}]
});

// MongoDB connection URIs
const dbUsers = "mongodb+srv://kohan3750:Data@cluster0.vdi3teq.mongodb.net/users?retryWrites=true&w=majority&appName=Cluster0";
const dbImage = "mongodb+srv://kohan3750:Data@cluster0.vdi3teq.mongodb.net/PostsCollections?retryWrites=true&w=majority&appName=Cluster0";

// Connect to the users database
mongoose.connect(dbUsers, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
const dbUsersConnection = mongoose.connection;
dbUsersConnection.on('error', console.error.bind(console, 'Error connecting to users database:'));
dbUsersConnection.once('open', () => {
    console.log('Connected to users database successfully');
});

// Connect to the images database
const dbImageConnection = mongoose.createConnection(dbImage, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
dbImageConnection.on('error', console.error.bind(console, 'Error connecting to images database:'));
dbImageConnection.once('open', () => {
    console.log('Connected to images database successfully');
});
1
// Define models
const User = dbUsersConnection.model('User', userSchema);
const PostsCollections = dbImageConnection.model('PostsCollections', postsSchema);

module.exports = {
    User,
    PostsCollections
};

