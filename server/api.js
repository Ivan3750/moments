const express = require("express");
const bcrypt = require("bcrypt");
const sharp = require('sharp');
const multer = require("multer");
const { User, PostsCollections } = require("./db.js");
const jwt = require('jsonwebtoken');

const SECRET_KEY = 'moments'; //DONT CHANGE!!!

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Реєстрація користувача
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
    const token = jwt.sign({ username: newUser.username, email: newUser.email }, SECRET_KEY, { expiresIn: '7d' });

    res.status(200).json({ token });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Вхід користувача
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).select("password email username");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ username: user.username, email: user.email }, SECRET_KEY, { expiresIn: '7d' });
    res.status(200).json({ token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Перевірка JWT токена
router.post("/checkJWT", (req, res) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Access Denied' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    res.status(200).json({ valid: true, decoded });
  } catch (err) {
    res.status(403).json({ valid: false, message: err.message });
  }
});

router.post("/decode", (req, res) => {
  const { token } = req.body;
  const decoded = jwt.decode(token);
  res.send(decoded);
});

router.post("/:username/upload", upload.single("image"), async (req, res) => {
  const username = req.params.username;

  try {
    let user = await PostsCollections.findOne({ username });

    if (!user) {
      user = new PostsCollections({ username, posts: [] });
    }

    const buffer = await sharp(req.file.buffer).webp().toBuffer();

    const newImage = {
      data: buffer,
      contentType: 'image/webp',
    };

    user.posts.push(newImage);
    await user.save();

    res.send({ data: buffer, contentType: 'image/webp' });
  } catch (err) {
    res.status(500).send("Failed to upload image");
  }
});

router.post("/:token/avatar", upload.single("image"), async (req, res) => {
  let token = jwt.decode(req.params.token);
  let email = token.email;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const buffer = await sharp(req.file.buffer)
      .resize({ width: 200 })
      .webp()
      .toBuffer();

    user.avatar = { data: buffer, contentType: 'image/webp' };
    await user.save();

    res.send({ data: buffer, contentType: 'image/webp' });
  } catch (err) {
    res.status(500).send("Failed to upload image");
  }
});

router.get("/posts/:username", async (req, res) => {
  try {
    const user = await PostsCollections.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user.posts);
  } catch (err) {
    res.status(500).json({ message: "Failed to retrieve images" });
  }
});

router.get("/user/:token", async (req, res) => {
  let token = jwt.decode(req.params.token);
  let email = token.email;
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
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed" });
  }
});

router.get("/search/:data", async (req, res) => {
  try {
    const regex = new RegExp(req.params.data, "i");
    const users = await User.find({ username: regex }).select('username avatar').limit(10);
    res.status(200).json(users);
  } catch (err) {
    res.status(500).send("Internal Server Error");
  }
});

router.get("/follow/:token/:username", async (req, res) => {
  try {
    let token = jwt.decode(req.params.token);
    let email = token.email;
    const { username } = req.params;
    const follower = await User.findOne({ username }).select('username stats');
    const me = await User.findOne({ email }).select('username stats');

    if (!follower || !me) {
      return res.status(404).send("User not found");
    }

    if (me.stats.following.includes(follower.username)) {
      return res.status(400).send("Already following this user");
    }

    me.stats.following.push(follower.username);
    follower.stats.followers.push(me.username);

    await me.save();
    await follower.save();

    res.json({ following: me.stats.following, followers: follower.stats.followers });
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

router.get("/unfollow/:token/:username", async (req, res) => {
  try {
    let token = jwt.decode(req.params.token);
    let email = token.email;
    const { username } = req.params;
    const follower = await User.findOne({ username }).select('username stats');
    const me = await User.findOne({ email }).select('username stats');

    if (!follower || !me) {
      return res.status(404).send("User not found");
    }

    if (!me.stats.following.includes(follower.username)) {
      return res.status(400).send("Not following this user");
    }

    me.stats.following = me.stats.following.filter(user => user !== follower.username);
    follower.stats.followers = follower.stats.followers.filter(user => user !== me.username);

    await me.save();
    await follower.save();

    res.json({ following: me.stats.following, followers: follower.stats.followers });
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

router.get("/checkFollow/:token/:username", async (req, res) => {
  try {
    let token = jwt.decode(req.params.token);
    let email = token.email;
    const { username } = req.params;
    const follower = await User.findOne({ username }).select('username');
    const me = await User.findOne({ email }).select('username stats');

    if (!follower || !me) {
      return res.status(404).send("User not found");
    }

    const isFollowing = me.stats.following.includes(follower.username);
    res.json({ isFollowing });
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

router.get("/content/:token", async (req, res) => {
  try {
    let token = jwt.decode(req.params.token);
    let email = token.email;
    let user = await User.findOne({ email });

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    let userFollowing = user.stats.following;
    let chooseUser = userFollowing[2];
    let findImages = await PostsCollections.findOne({ username: chooseUser }).select("posts");
    let findInfo = await User.findOne({ username: chooseUser });
    let findAvatar = findInfo.avatar;

    res.send([findImages, chooseUser, findAvatar]);
  } catch (error) {
    res.status(500).send({ message: "Server error" });
  }
});

router.get("/content/post/:id", async (req, res) => {
  try {
    const postId = req.params.id;
    const document = await PostsCollections.findOne({ "posts._id": postId });
    if (document && document.posts) {
      const post = document.posts.id(postId);
      const user = await User.findOne({ username: document.username }).select("avatar username");
      if (post) {
        res.json([post, user]);
      } else {
        res.status(404).json({ message: "Post not found" });
      }
    } else {
      res.status(404).json({ message: "No posts found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

router.post("/content/:action/post/:id/:token", async (req, res) => {
  try {
    const { action, id, token } = req.params;

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      return res.status(403).json({ message: "Invalid token" });
    }

    const email = decodedToken.email;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const document = await PostsCollections.findOne({ "posts._id": id });
    if (!document) {
      return res.status(404).json({ message: "Post not found" });
    }

    const post = document.posts.id(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    switch (action) {
      case "like":
        if (!post.likes.includes(user.username)) {
          post.likes.push(user.username);
        } else {
          post.likes = post.likes.filter(likeUser => likeUser !== user.username);
        }
        break;
      case "view":
        if (!post.views.includes(user.username)) {
          post.views.push(user.username);
        }
        break;
      case "share":
        if (!post.shares.includes(user.username)) {
          post.shares.push(user.username);
        }
        break;
      case "comment":
        post.comments.push({ username: user.username, comment: req.body.comment || "" });
        break;
      default:
        return res.status(400).json({ message: "Invalid action" });
    }

    await document.save();
    res.json({ message: `Post ${action}d successfully`, post });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
router.get("/content/:token/post/:id", async (req, res) => {
  try {
    const { id, token } = req.params;
    const decodedToken = jwt.verify(token, SECRET_KEY);
    
    const user = await User.findOne({ email: decodedToken.email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userPosts = await PostsCollections.findOne({ username: user.username }).select;
    if (!userPosts || !userPosts.posts) {
      return res.status(404).json({ message: "User posts not found" });
    }

    // Find the post with matching _id in userPosts.posts array
    const post = userPosts.posts.find(p => p._id == id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.send(post);
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({ message: "Invalid token" });
    }
    res.status(500).json({ message: "Server error: " + err.message });
  }
});


module.exports = router;
