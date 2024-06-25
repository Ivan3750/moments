/* import {loadProfileData} from "../profile.js"
 */import { getUser } from "../getData.js";

const filePost = document.querySelector('.file-post');
const inputText = document.querySelector('#input-text');
const inputFile = document.querySelector('#input-file');
const sendPhotoBtn = document.querySelector('#send-photo-btn');
const posts = document.querySelector('.account-posts');
const modal = document.querySelector('.modal-create');
const closeModal = document.querySelector('.close-modal');


closeModal.addEventListener("click", ()=>{
    modal.classList.remove("show")
})

/* filePost.addEventListener("change", (event)=>{
    let file = event.target.files[0];
    
}) */

    sendPhotoBtn.addEventListener("click", () => {
        let file = inputFile.files[0];
        let formData = new FormData();
        formData.append('image', file);
        getUser().then(user=>{
            console.log(JSON.stringify(user.username))
            fetch(`/${JSON.stringify(user.username).replace(/^"(.*)"$/, '$1')}/upload`, {  //CHANGE USERNAME
                method: "POST",
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                console.log('Upload successful:', data);
                modal.classList.remove("show")
                getPhoto()
                loadProfileData()
    
            })
            .catch(error => {
                console.error('Error uploading image:', error);
            });
        
        })
    });
    





