const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const multer = require("multer");
const path = require("path");
const sharp = require("sharp");


dotenv.config();

const app = express();

app.use(bodyParser.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

/* DB */
mongoose.set('strictQuery', true);
const dbURL =  "mongodb+srv://kohan3750:Data@cluster0.vdi3teq.mongodb.net/users?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(dbURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));



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
    }]
  });
const User = mongoose.model("User", userSchema);

/* REGISTER */
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: "Username or email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.status(200).json({ email: email });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/* LOGIN */
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select("email password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.status(200).json({ email: email });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* MAIN */
app.use(express.static(path.join(__dirname, "../src")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../src", "pages", "login.html"), (err) => {
    if (err) {
      res.status(err.status || 500).send("Internal Server Error");
    }
  });
});

app.get("/myprofile", (req, res) => {
  res.sendFile(path.join(__dirname, "../src", "pages", "myprofile.html"), (err) => {
    if (err) {
      res.status(err.status || 500).send("Internal Server Error");
    }
  });
});

app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "../src", "pages", "main.html"), (err) => {
    if (err) {
      res.status(err.status || 500).send("Internal Server Error");
    }
  });
});

app.get("/:username", async (req, res) => {
  let username = req.params.username;
  if (username === "myprofile") {
    return res.redirect("/myprofile");
  }
  try {
    const user = await User.findOne({ username });
    let indexPath;

    if (!user) {
      indexPath = path.join(__dirname, "../src", "pages", "404.html");
    } else {
      indexPath = path.join(__dirname, "../src", "pages", "account.html");
    }

    res.sendFile(indexPath, (err) => {
      if (err) {
        res.status(err.status || 500).send("Internal Server Error");
      }
    });
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

/* UPLOAD */
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post("/:username/upload", upload.single("image"), async (req, res) => {
  let username = req.params.username;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const buffer = await sharp(req.file.buffer)
      .resize({ width: 800 }) // Зміна розміру зображення до 800 пікселів в ширину
      .toFormat('webp') // Конвертація у формат WebP
      .toBuffer();

    const newImage = {
      data: buffer,
      contentType: 'image/webp'
    };

    user.images.push(newImage);
    await user.save();

    res.send({ data: buffer, contentType: 'image/webp' });
  } catch (err) {
    res.status(500).send("Failed to upload image");
  }
});

app.post("/:username/avatar", upload.single("image"), async (req, res) => {
  let username = req.params.username;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const buffer = await sharp(req.file.buffer)
      .resize({ width: 800 }) // Зміна розміру зображення до 800 пікселів в ширину
      .toFormat('webp') // Конвертація у формат WebP
      .toBuffer();

    const newImage = {
      data: buffer,
      contentType: 'image/webp'
    };

    user.avatar = newImage;
    await user.save();

    res.send({ data: buffer, contentType: 'image/webp' });
  } catch (err) {
    res.status(500).send("Failed to upload image");
  }
});

/* PHOTOS */
app.get("/photos/:username", async (req, res) => {
  try {
    const username = req.params.username;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user.images);
  } catch (err) {
    res.status(500).json({ message: "Failed to retrieve images" });
  }
});

/* USER */
app.get("/user/:email", async (req, res) => {
  const email = req.params.email;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed" });
  }
});

app.get("/username/:username", async (req, res) => {
  const username = req.params.username;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed" });
  }
});

app.get("/search/:data", async (req, res) => {
  const searchData = req.params.data;
  try {
    const regex = new RegExp(searchData, "i");
    const users = await User.find({ username: regex }).select('username avatar').limit(10); 
    res.status(200).json(users);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});



app.get("/follow/:email/:username", async (req, res) => {
  try {
    const { username, email } = req.params;

    // Find the follower (user who is performing the follow action)
    const follower = await User.findOne({ username }).select('username stats');
    if (!follower) {
      return res.status(404).send("Follower not found");
    }

    // Find the user to be followed
    const me = await User.findOne({ email }).select('username stats');
    if (!me) {
      return res.status(404).send("User to follow not found");
    }

    // Check if already following
    if (me.stats.following.includes(follower.username)) {
      return res.status(400).send("Already following this user");
    }

    // Update following and followers stats
    me.stats.following.push(follower.username);
    follower.stats.followers.push(me.username);

    // Save updated stats
    await me.save();
    await follower.save();

    // Respond with updated stats
    res.json({
      following: me.stats.following,
      followers: follower.stats.followers
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.all("*", (req, res) => {
  res.status(405).json({ message: "Method Not Allowed" });
});
