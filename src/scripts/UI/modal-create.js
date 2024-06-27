import { getUser, getPhoto } from "../getData.js";
const filePost = document.querySelector('.file-post');
const inputText = document.querySelector('#input-text');
const inputFile = document.querySelector('#input-file');
const sendPhotoBtn = document.querySelector('#send-photo-btn');
const posts = document.querySelector('.account-posts');
const modal = document.querySelector('.modal-create');
const closeModalCreate = document.querySelector('.close-modal-create');
const statsPostsTxT = document.querySelector('.account-stats-posts');



closeModalCreate.addEventListener("click", ()=>{
    modal.classList.remove("show")
})

/* filePost.addEventListener("change", (event)=>{
    let file = event.target.files[0];
    
}) */

    inputFile.addEventListener("change", () => {
        let file = inputFile.files[0];
        let formData = new FormData();
        formData.append('image', file);
        getUser().then(user=>{
            fetch(`API/${JSON.stringify(user.username).replace(/^"(.*)"$/, '$1')}/upload`, {  //CHANGE USERNAME
                method: "POST",
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                modal.classList.remove("show")
                getPhoto(user.username)
                statsPostsTxT.textContent = user.images.length + " posts"

                
            })
            .catch(error => {
            });
        
        })
    });
    





