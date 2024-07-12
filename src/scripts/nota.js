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



/* MAYBE FOR SETTINGS PHOTO  */







/* SETTINGS

CHANGE MAIL
CHANGE PASSWORD
CHANGE NICKNAME
DELETE PROFILE

*/







/* const getPhoto = ()=>{
    const email = JSON.parse(localStorage.user).email
    fetch(`http://localhost:5000/photos/${email}`)
    .then(res => res.json())
    .then(data => {
        posts.innerHTML = ""
        console.log(data.length)
        if(data.length !== 0){
            function toBase64(arr) {
                return btoa(
                    new Uint8Array(arr).reduce((data, byte) => data + String.fromCharCode(byte), '')
                );
            }
    
            data.forEach(image => {
                const imgElement = document.createElement('img');
                imgElement.src = `data:${image.contentType};base64,${toBase64(image.data.data)}`;
                imgElement.className = 'post';
                posts.prepend(imgElement);
            });
        }else{
            const notImg = document.createElement("p")
            notImg.textContent = "No images"
            posts.prepend(notImg)

        }

       
    })
    .catch(error => {
        console.error('Error fetching images:', error);
    });
} */









    