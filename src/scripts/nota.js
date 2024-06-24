user = {
    username: "",
    email: "",
    password: "",
    name: "",
    avatar: "",
    followers: [username],
    following: [username],
    posts: [{img, text}],

}


/* GET */

username - "/:username/"



/* POST */

username - "/:username/:username"
email - "/:username/email"
name - "/:username/name"
followers - "/:username/followers"
following - "/:username/following"
posts - "/:username/post"

+ data

/* PUT */

username - "/:username/username"
email - "/:username/email"
name - "/:username/name"

+data
/* DELETE */
posts - "/:username/posts"
followers - "/:username/follower"
following - "/:username/follower"

+data
