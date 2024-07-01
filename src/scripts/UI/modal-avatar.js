import { getUser } from "../getData.js"
import { loadMyProfileData } from "../myprofile.js";



const accountAvatar = document.querySelector('.account-avatar');
const accountAvatarBox = document.querySelector('.account-avatar-box');
const modalAvatar = document.querySelector('.modal-avatar');
accountAvatarBox.addEventListener("click", ()=>{
    modalAvatar.classList.add("show")
    
})


const filePost = document.querySelector('.file-post');
const inputText = ""
const inputFile = document.querySelector('#avatar-file');
const sendAvatarBtn = document.querySelector('#send-avatar-btn');
const posts = document.querySelector('.account-posts');
const closeModalAvatar = document.querySelector('.close-modal-avatar');
console.log(closeModalAvatar)

closeModalAvatar.addEventListener("click", ()=>{
    console.log("S")
    modalAvatar.classList.remove("show")

})

inputFile.addEventListener("input", () => {
    let file = inputFile.files[0];
    let formData = new FormData();
    formData.append('image', file);
        fetch(`API/${JSON.parse(localStorage.token)}/avatar`, {  //CHANGE USERNAME
            method: "POST",
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            modalAvatar.classList.remove("show")
            loadMyProfileData()

        })
        .catch(error => {
        });
    
});