import { getUser, setPosts } from "../getData.js";

// Отримуємо елементи DOM
const elements = {
    filePost: document.querySelector('.file-post'),
    inputText: document.querySelector('#input-text'),
    inputFile: document.querySelector('#input-file'),
    sendPhotoBtn: document.querySelector('#send-photo-btn'),
    posts: document.querySelector('.account-posts'),
    modal: document.querySelector('.modal-create'),
    closeModalCreate: document.querySelector('.close-modal-create'),
    statsPostsTxT: document.querySelector('.account-stats-posts')
};

// Функція для закриття модального вікна
const closeModal = () => {
    elements.modal.classList.remove("show");
};

// Обробник закриття модального вікна
elements.closeModalCreate.addEventListener("click", closeModal);

// Обробник зміни файлу
const handleFileChange = async () => {
    const file = elements.inputFile.files[0];
    if (file) {
        const formData = new FormData();
        formData.append('image', file);

        try {
            const user = await getUser();
            const response = await fetch(`API/${user.username}/upload`, {
                method: "POST",
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                closeModal();
                setPosts(user.username);
                elements.statsPostsTxT.textContent = `${user.images.length} posts`;
            } else {
                console.error('Failed to upload image');
            }
        } catch (error) {
            console.error('An error occurred:', error);
        }
    }
};

// Додаємо обробник події на зміну файлу
elements.inputFile.addEventListener("change", handleFileChange);

// Обробник для завантаження сторінки
window.addEventListener("load", () => {
    console.log("Page loaded");
});
