const express = require("express");
const bcrypt = require("bcrypt");
const sharp = require('sharp');
const multer = require("multer");
const { User, PostsCollections } = require("./db.js");
const { main } = require("./download.js");
const jwt = require('jsonwebtoken');

const SECRET_KEY = 'moments'; //DONT CHANGE!!!
const clientId = '70188fa5';
const clientSecret = 'cd26e5c31285079ca95bb34eab96c3b0';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });



// Реєстрація користувача
router.get('/audio/:name', async (req, res) => {
  try {
    const filePath = await main(req.params.name);
    res.send(filePath);
    console.log(filePath)
  } catch (error) {
    res.status(500).send(error.message);
  }
});

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
router.put("/update", async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]; // Assuming Bearer token is used
  if (!token) {
    return res.status(401).json({ message: "Authorization token required" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const { username, email, password } = req.body;

    const updatedData = {};
    if (username) updatedData.username = username;
    if (email) updatedData.email = email;
    if (password) updatedData.password = await bcrypt.hash(password, 10);

    const updatedUser = await User.findOneAndUpdate(
      { email: decoded.email }, // Assuming the email is unique and used to find the user
      { $set: updatedData },
      { new: true }
    );

    if (username) {
      await PostsCollections.updateMany(
        { username: decoded.username }, // Assuming the original username is in the decoded token
        { $set: { username: username } },
        { new: true }
      );
    }

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User updated successfully", user: updatedUser });
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Invalid token" });
    }
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
router.get("/delete/:token", async (req, res) => {
  let token;
  try {
    token = jwt.decode(req.params.token);
    if (!token || !token.email) {
      return res.status(400).json({ message: "Invalid token" });
    }
  } catch (error) {
    return res.status(400).json({ message: "Invalid token format" });
  }

  let email = token.email;
  try {
    const user = await User.findOneAndDelete({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully", user });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete user" });
  }
});

module.exports = router;

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

router.get("/content/post/:id/", async (req, res) => {
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
    const { comment } = req.body;  // Extract comment from req.body

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
      case "share":
        if (!post.shares.includes(user.username)) {
          post.shares.push(user.username);
        }
        break;
      case "comment":
        if (comment) {  // Ensure comment is defined
          post.comments.push({ username: user.username, comments: comment });
        } else {
          return res.status(400).json({ message: "Comment is required" });
        }
        break;
      default:
        return res.status(400).json({ message: "Invalid action" });
    }

    await document.save();
    const pc = post.comments
    res.status(200).json({ message: "Action performed successfully", pc });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

/* 
router.get("/content/nextPost/:token", async (req, res) => {
  try {
      let token = jwt.verify(req.params.token, SECRET_KEY);
      let email = token.email;
      let user = await User.findOne({ email });

      if (!user) {
          return res.status(404).send({ message: "User not found" });
      }

      // Initialize viewedPosts if it is undefined or null
      if (!Array.isArray(user.viewedPostIDs)) {
          user.viewedPostIDs = [];
      }

      let allUsers = await User.find({});
      
      // Exclude the current user
      allUsers = allUsers.filter(otherUser => otherUser.username !== user.username);
      
      if (allUsers.length === 0) {
          return res.status(404).send({ message: "No other users found" });
      }

      let chooseUser = null;
      let findImages = null;

      while (allUsers.length > 0) {
          // Select a random user
          let randomUserIndex = Math.floor(Math.random() * allUsers.length);
          chooseUser = allUsers[randomUserIndex].username;

          findImages = await PostsCollections.findOne({ username: chooseUser }).select("posts");

          // Remove user from the list if no posts found
          if (!findImages || findImages.posts.length === 0) {
              allUsers.splice(randomUserIndex, 1);
              chooseUser = null;
              findImages = null;
          } else {
              break;
          }
      }

      if (!chooseUser || !findImages) {
          return res.status(404).send({ message: "No posts found for any user" });
      }

      // Ensure viewedPostIDs is an array of strings
      let viewedPostIDs = user.viewedPostIDs.map(postId => postId.toString());

      // Filter out already viewed posts
      let availablePosts = findImages.posts.filter(post => !viewedPostIDs.includes(post._id.toString()));

      if (availablePosts.length === 0) {
          return res.status(404).send({ message: "No new posts available" });
      }

      // Select a random post from the available posts
      let randomPostIndex = Math.floor(Math.random() * availablePosts.length);
      let nextPostID = findImages[randomPostIndex]._id; //off findImages on availablePosts

      // Add this post to the user's viewed posts
      user.viewedPostIDs.push(nextPostID);
      await user.save();

      res.send({ nextPostID });
  } catch (error) {
      res.status(500).send({ message: "Server error", error: error.message });
  }
}); */


router.get("/content/nextPost/:token", async (req, res) => {
    try {
        let token = jwt.verify(req.params.token, SECRET_KEY);
        let email = token.email;
        let user = await User.findOne({ email });

        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }

        let allUsers = await User.find({});

        // Exclude the current user
        allUsers = allUsers.filter(otherUser => otherUser.username !== user.username);

        if (allUsers.length === 0) {
            return res.status(404).send({ message: "No other users found" });
        }

        let chooseUser = null;
        let findImages = null;

        while (allUsers.length > 0) {
            // Select a random user
            let randomUserIndex = Math.floor(Math.random() * allUsers.length);
            chooseUser = allUsers[randomUserIndex].username;

            findImages = await PostsCollections.findOne({ username: chooseUser }).select("posts");

            // Remove user from the list if no posts found
            if (!findImages || findImages.posts.length === 0) {
                allUsers.splice(randomUserIndex, 1);
                chooseUser = null;
                findImages = null;
            } else {
                break;
            }
        }

        if (!chooseUser || !findImages) {
            return res.status(404).send({ message: "No posts found for any user" });
        }

        // Select a random post from the available posts
        let randomPostIndex = Math.floor(Math.random() * findImages.posts.length);
        let nextPostID = findImages.posts[randomPostIndex]._id;

        res.send({ nextPostID });
    } catch (error) {
        res.status(500).send({ message: "Server error", error: error.message });
    }
});






router.get("/content/comment/:id", async(req,res)=>{
  const postId = req.params.id
  const doc = await PostsCollections.findOne({ "posts._id": postId });
  const post = doc.posts.id(postId);

  const comments = post.comments
  res.send(comments)


})

router.get("/content/check/:id/:token", async (req, res) => {
  try {
      let token = jwt.verify(req.params.token, SECRET_KEY);
      let email = token.email;
      let user = await User.findOne({ email });

      if (!user) {
          return res.status(404).send({ message: "User not found" });
      }

      const postId = req.params.id;
      const doc = await PostsCollections.findOne({ "posts._id": postId });

      if (!doc) {
          return res.status(404).send({ message: "Post not found" });
      }

      const post = doc.posts.id(postId);

      if (!post) {
          return res.status(404).send({ message: "Post not found" });
      }

      const status = post.likes.includes(user.username);
      const likes = post.likes
      const shares = post.shares
      const comments = post.comments
      res.send({ liked: status, likes: likes, shares: shares, comments: comments });
  } catch (error) {
      res.status(500).send({ message: "Server error", error: error.message });
  }
});


router.post("/content/toggleLike/:id/:token", async (req, res) => {
  try {
      const token = jwt.verify(req.params.token, SECRET_KEY);
      const email = token.email;
      const user = await User.findOne({ email });

      if (!user) {
          return res.status(404).send({ message: "User not found" });
      }

      const postId = req.params.id;
      const doc = await PostsCollections.findOne({ "posts._id": postId });

      if (!doc) {
          return res.status(404).send({ message: "Post not found" });
      }

      const post = doc.posts.id(postId);

      if (!post) {
          return res.status(404).send({ message: "Post not found" });
      }

      const userIndex = post.likes.indexOf(user.username);

      if (userIndex > -1) {
          // User has already liked the post, so remove the like
          post.likes.splice(userIndex, 1);
      } else {
          // User has not liked the post, so add the like
          post.likes.push(user.username);
      }

      await doc.save();
      res.send({ message: "Like status updated" });
  } catch (error) {
      res.status(500).send({ message: "Server error", error: error.message });
  }
});



module.exports = router;
