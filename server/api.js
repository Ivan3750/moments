const express = require("express")
const bcrypt = require("bcrypt")
const sharp = require('sharp');
const multer = require("multer")
const {User} = require("./db.js");
const {Image} = require("./db.js");




const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
// Register endpoint
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(409).json({ message: "Username or email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.status(200).json({ email: email });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Login endpoint
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select("password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.status(200).json({ email: email });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



router.post("/:username/upload", upload.single("image"), async (req, res) => {
  const username = req.params.username;

  try {
    let user = await Image.findOne({ username });

    if (!user) {
      user = new Image({ username, images: [] });
    }

    const buffer = await sharp(req.file.buffer)
      .webp()
      .toBuffer();

    const newImage = {
      data: buffer,
      contentType: 'image/webp'
    };

    user.images.push(newImage);
    await user.save();

    res.send({ data: buffer, contentType: 'image/webp' });
  } catch (err) {
    console.error(err); // Log the error for debugging
    res.status(500).send("Failed to upload image");
  }
});

router.post("/:username/avatar", upload.single("image"), async (req, res) => {
  let username = req.params.username;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const buffer = await sharp(req.file.buffer)
      .resize({ width: 200 }) // Зміна розміру зображення до 800 пікселів в ширину
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

router.get("/photos/:username", async (req, res) => {
  try {
    const username = req.params.username;
    const user = await Image.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user.images);
  } catch (err) {
    res.status(500).json({ message: "Failed to retrieve images" });
  }
});

router.get("/user/:email", async (req, res) => {
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

router.get("/username/:username", async (req, res) => {
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

router.get("/search/:data", async (req, res) => {
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


router.get("/follow/:email/:username", async (req, res) => {
  try {
    const { username, email } = req.params;
    const follower = await User.findOne({ username }).select('username stats');
    if (!follower) {
      return res.status(404).send("Follower not found");
    }
    const me = await User.findOne({ email }).select('username stats');
    if (!me) {
      return res.status(404).send("User to follow not found");
    }
    if (me.stats.following.includes(follower.username)) {
      return res.status(400).send("Already following this user");
    }
    me.stats.following.push(follower.username);
    follower.stats.followers.push(me.username);

    await me.save();
    await follower.save();

    res.json({
      following: me.stats.following,
      followers: follower.stats.followers
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// Unfollow a user
router.get("/unfollow/:email/:username", async (req, res) => {
  try {
    const { username, email } = req.params;
    const follower = await User.findOne({ username }).select('username stats');
    if (!follower) {
      return res.status(404).send("Follower not found");
    }
    const me = await User.findOne({ email }).select('username stats');
    if (!me) {
      return res.status(404).send("User to follow not found");
    }
    if (!me.stats.following.includes(follower.username)) {
      return res.status(400).send("Not following this user");
    }
    me.stats.following = me.stats.following.filter(user => user !== follower.username);
    follower.stats.followers = follower.stats.followers.filter(user => user !== me.username);

    await me.save();
    await follower.save();

    res.json({
      following: me.stats.following,
      followers: follower.stats.followers
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// Function to check if a user is already following another user
router.get("/checkFollow/:email/:username", async (req, res) => {
  try {
    const { username, email } = req.params;
    const follower = await User.findOne({ username }).select('username');
    if (!follower) {
      return res.status(404).send("Follower not found");
    }
    const me = await User.findOne({ email }).select('username stats');
    if (!me) {
      return res.status(404).send("User not found");
    }
    const isFollowing = me.stats.following.includes(follower.username);
    res.json({ isFollowing });

  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});



module.exports = router;
