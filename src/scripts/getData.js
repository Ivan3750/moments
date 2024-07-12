/* import {LoadView} from "./UI/view-post.js"
 */
const accountAvatar = document.querySelector('.account-avatar');
const posts = document.querySelector('.account-posts');
const statsPosts = document.querySelector('.account-stats-posts');
const viewPostBlock = document.querySelector('.view-post-block');
const viewPost = document.querySelector('.view-post');
let viewPostStatus = false


export const getUser = async () => {
    try {
        const response = await fetch(`API/user/${JSON.parse(localStorage.token)}`);
        const user = await response.json();
        return user;
    } catch (error) {
        return null;
    }
 };
export const getUserByUserName = async (value) => {
    try {
        const response = await fetch(`API/username/${value}`);
        const user = await response.json();
        return user;
    } catch (error) {
        return null;
    }
}; 



export const setPosts = (usernameFromURL)=>{
    fetch(`API/posts/${usernameFromURL}`)
    .then(res => res.json())
    .then(data => {
        posts.innerHTML = ""
        if(data.length !== 0 && data.length){
            statsPosts.textContent = data.length + " posts"
            function toBase64(arr) {
                return btoa(
                    new Uint8Array(arr).reduce((data, byte) => data + String.fromCharCode(byte), '')
                );
            }
    
            data.forEach(image => {
                const imgElement = document.createElement('img');
                imgElement.id = "posts-container"
                imgElement.src = `data:${image.contentType};base64,${toBase64(image.data.data)}`;
                imgElement.className = 'post';
                imgElement.addEventListener("click", ()=>{
                    fetch(`API/username/${usernameFromURL}`)
                    .then(res => res.json())
                    .then(data=>{
/*                         LoadView(image, usernameFromURL, data.avatar);
 */                        localStorage.ACTIVE_POST_ID = image._id
                    })

                

                    viewPostBlock.classList.add("show")
                    viewPostStatus = true
                    
                    viewPostBlock.addEventListener("click", (e)=>{
                        if(e.target !== viewPost){
                            viewPostBlock.classList.remove("show")
                        }
                    })
                })
                posts.prepend(imgElement);
            });
        }else{
            const notImg = document.createElement("p")
            notImg.textContent = "No images"
            posts.prepend(notImg)

        }

       
    })
    
}

export const setAvatar = (avatar, InAvatar) => {
    function toBase64(arr) {
        return btoa(
            new Uint8Array(arr).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
    }

    try {
        const base64String = toBase64(avatar.data.data);
        InAvatar.src = `data:${avatar.contentType};base64,${base64String}`;
    } catch (error) {
        InAvatar.src = `https://as2.ftcdn.net/v2/jpg/03/49/49/79/1000_F_349497933_Ly4im8BDmHLaLzgyKg2f2yZOvJjBtlw5.jpg`;

    }
}