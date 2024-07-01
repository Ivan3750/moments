const express = require("express");
const path = require("path");
const {User} = require("./db.js");


const router = express.Router();

// Serve login page
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../src", "pages", "main.html"), (err) => {
    if (err) {
      res.status(err.status || 500).send("Internal Server Error");
    }
  });
});
router.get("/auth", (req, res) => {
  res.sendFile(path.join(__dirname, "../src", "pages", "login.html"), (err) => {
    if (err) {
      res.status(err.status || 500).send("Internal Server Error");
    }
  });
});

router.get("/myprofile", (req, res) => {
  res.sendFile(path.join(__dirname, "../src", "pages", "myprofile.html"), (err) => {
    if (err) {
      res.status(err.status || 500).send("Internal Server Error");
    }
  });
});

router.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "../src", "pages", "main.html"), (err) => {
    if (err) {
      res.status(err.status || 500).send("Internal Server Error");
    }
  });
});

router.get("/:username", async (req, res) => {
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
        res.status(err.status || 500).send(err)
      }
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
