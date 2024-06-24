import {loadProfileData} from "./profile.js"

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
    
        fetch("http://localhost:5000/admin/upload", {  //CHANGE USERNAME
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
    });
    

const getPhoto = ()=>{
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
}



getPhoto()