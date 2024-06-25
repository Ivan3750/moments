import { getUser } from "../getData.js"
import { loadMyProfileData } from "../myprofile.js";



const accountAvatar = document.querySelector('.account-avatar');
const modalAvatar = document.querySelector('.modal-avatar');
accountAvatar.addEventListener("click", ()=>{
    modalAvatar.classList.add("show")
    
})


const filePost = document.querySelector('.file-post');
const inputText = ""
const inputFile = document.querySelector('#avatar-file');
const sendAvatarBtn = document.querySelector('#send-avatar-btn');
const posts = document.querySelector('.account-posts');
const closeModal = document.querySelector('.close-modal');

console.log(sendAvatarBtn)
sendAvatarBtn.addEventListener("click", () => {
    let file = inputFile.files[0];
    console.log(file)
    let formData = new FormData();
    formData.append('image', file);
    getUser().then(user=>{
        console.log(JSON.stringify(user.username))
        fetch(`/${JSON.stringify(user.username).replace(/^"(.*)"$/, '$1')}/avatar`, {  //CHANGE USERNAME
            method: "POST",
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            console.log('Upload successful:', data);
            modalAvatar.classList.remove("show")
            loadMyProfileData()

        })
        .catch(error => {
            console.error('Error uploading image:', error);
        });
    
    })
});