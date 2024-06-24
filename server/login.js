const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');

let activeUser;

dotenv.config();

const app = express();

app.use(bodyParser.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));




/* DB */
const dbURL = "mongodb+srv://kohan3750:Data@cluster0.vdi3teq.mongodb.net/users?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(dbURL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));


  const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    description: { type: String, default: "" },
    avatar: {  
      data: Buffer, 
      contentType: String 
    },
    stats: {
      followers: { type: Number, default: 0 }, 
      following: { type: Number, default: 0 }  
    },
    images: [{ 
      data: Buffer, 
      contentType: String 
    }]
  });
  

const User = mongoose.model('User', userSchema);


/* REGISTER */

app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


/* LOGIN */



app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    activeUser = user;
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.status(200).json({ "email": email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});



/* MAIN */
app.use(express.static(path.join(__dirname, 'pages')));

app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, '../pages', 'login.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error sending index.html:', err);
      res.status(err.status || 500).send('Internal Server Error');
    }
  });
});


/* UPLOAD */


const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/:username/upload', upload.single('image'), async (req, res) => {
  let username = req.params.username
  try {
    if (!username) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const user = await User.findOne({username});
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newImage = {
      data: req.file.buffer,
      contentType: req.file.mimetype
    };
    
    user.images.push(newImage);
    await user.save();

    res.send({ data: req.file.buffer, contentType: req.file.mimetype });
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to upload image');
  }
});




/* PHOTOS */
app.get('/photos/:email', async (req, res) => {
  try {
    const email = req.params.email
    if (!email) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const user = await User.findOne({email});
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.images);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to retrieve images' });
  }
});

/* USER */
app.get('/user/:email', async (req, res) => {
  const email = req.params.email
  try {
    if (!email) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const user = await User.findOne({email});
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed' });
  }
});




const PORT =  5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.all('*', (req, res) => {
  res.status(405).json({ message: 'Method Not Allowed' });
});
