import { getUser, setPosts } from "../getData.js";

// Отримуємо елементи DOM
const filePost = document.querySelector('.file-post');
const inputText = document.querySelector('#input-text');
const inputFile = document.querySelector('#input-file');
const sendPhotoBtn = document.querySelector('#send-photo-btn');
const posts = document.querySelector('.account-posts');
const modal = document.querySelector('.modal-create');
const closeModalCreate = document.querySelector('.close-modal-create');
const statsPostsTxT = document.querySelector('.account-stats-posts');

// Функція для закриття модального вікна
const closeModal = () => {
    modal.classList.remove("show");
}

// Обробник закриття модального вікна
closeModalCreate.addEventListener("click", closeModal);

// Обробник зміни файлу
const handleFileChange = async () => {
    const file = inputFile.files[0];
    if (file) {
        const formData = new FormData();
        formData.append('image', file);
        
        try {
            const user = await getUser();
            const response = await fetch(`API/${user.username}/upload`, {  //CHANGE USERNAME
                method: "POST",
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                closeModal();
                setPosts(user.username);
                statsPostsTxT.textContent = `${user.images.length} posts`;
            } else {
                console.error('Failed to upload image');
            }
        } catch (error) {
            console.error('An error occurred:', error);
        }
    }
}

// Додаємо обробник події на зміну файлу
inputFile.addEventListener("change", handleFileChange);

// Обробник для завантаження сторінки
window.addEventListener("load", () => {
    console.log("Page loaded");
});
