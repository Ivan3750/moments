import { dataMusic } from "../Utils/dataMusic.js"; // Імпортуємо дані музичних треків
import { trackIndex } from '../UI/player.js'; // Імпортуємо індекс поточного треку
import { loadTrack } from '../UI/player.js'; // Імпортуємо функцію завантаження треку
import { getFavoriteTracks } from '../UI/player.js'; // Імпортуємо функцію отримання улюблених треків
import { playTrack } from '../UI/player.js'; // Імпортуємо функцію для запуску треку

// Знаходимо елементи DOM та зберігаємо їх у відповідні змінні
const ppList = document.querySelector('.player-page-list');
const ppText = document.querySelector('.player-page-text');
const btnText = document.querySelector('.btn-text');
const btnLike = document.querySelector('.btn-like');
const btnNext = document.querySelector('.btn-next');
const selectGenre = document.querySelector('#select-genre');
const tracks = dataMusic; // Зберігаємо дані музичних треків у змінну

// Експортуємо функцію trackLoad для завантаження треку в чергу програвача
export const trackLoad = (img, title, artist, id) => {

    // Створюємо елемент для черги програвача та додаємо до нього клас
    const playerQueue = document.createElement("div");
    playerQueue.classList.add("player-queue-box");

    // Додаємо обробник події "click" до елемента черги програвача
    playerQueue.addEventListener("click", ()=>{
        playerQueueOn(id, playerQueue) // Викликаємо функцію для активації обраного треку
    });

    // Створюємо елемент для деталей черги програвача та додаємо до нього клас
    const playerQueueDetails = document.createElement("div");
    playerQueueDetails.classList.add("player-queue-details");

    // Створюємо елемент зображення треку та задаємо його джерело
    const playerQueueImg = document.createElement("img");
    playerQueueImg.src = "../assets/images/tracks/" + img;
    playerQueueImg.classList.add("player-queue-img");

    // Створюємо елемент назви треку та додаємо текстове вміст
    const playerQueueTitle = document.createElement("p");
    playerQueueTitle.textContent = title;
    playerQueueTitle.classList.add("player-queue-title");

    // Створюємо елемент виконавця треку та додаємо текстове вміст
    const playerQueueArtist = document.createElement("p");
    playerQueueArtist.textContent = artist;
    playerQueueArtist.classList.add("player-queue-artist");

    // Додаємо елементи до DOM
    ppList.append(playerQueue);
    playerQueueDetails.append(playerQueueTitle, playerQueueArtist);
    playerQueue.append(playerQueueImg, playerQueueDetails);
}

// Експортуємо функцію playerQueueOn для активації обраного треку в черзі
export const playerQueueOn = (id, el) => {
    const playerQueues = document.querySelectorAll(".player-queue-box"); // Знаходимо всі елементи черги
    playerQueues.forEach(queue => {
        queue.classList.remove("active"); // Видаляємо клас 'active' з усіх елементів черги
    });
    loadTrack(id - 1); // Завантажуємо обраний трек
    playTrack() // Запускаємо обраний трек
    el.classList.add("active"); // Додаємо клас 'active' до обраного елемента черги
};

// Функція для завантаження тексту треку
const textLoad = (index) => {
    const textTrack = document.createElement("p"); // Створюємо елемент для тексту треку
    textTrack.textContent = tracks[index].txt; // Додаємо текстове вміст
    textTrack.classList.add("player-page-text");
    textTrack.classList.add("show");
    ppText.append(textTrack); // Додаємо елемент до DOM
}

// Додаємо обробник події "click" до кнопки 'btnNext'
btnNext.addEventListener("click", () => {
    ppList.innerHTML = ""; // Очищаємо список треків
    tracks.forEach((track) => {
        trackLoad(track.img, track.title, track.artist, track.id); // Завантажуємо всі треки в чергу
    });
});

// Додаємо обробник події "click" до кнопки 'btnLike'
btnLike.addEventListener("click", () => {
    ppList.innerHTML = ""; // Очищаємо список треків
    let favoriteTracks = getFavoriteTracks(); // Отримуємо улюблені треки
    favoriteTracks.forEach((favoriteTrack) => {
        trackLoad(favoriteTrack.img, favoriteTrack.title, favoriteTrack.artist, favoriteTrack.id); // Завантажуємо улюблені треки в чергу
    });
});

// Додаємо обробник події "change" до випадаючого списку 'selectGenre'
selectGenre.addEventListener("change", () => {
    ppList.innerHTML = ""; // Очищаємо список треків
    tracks.forEach((track) => {
        if (track.genre === selectGenre.value) { // Перевіряємо жанр треку
            trackLoad(track.img, track.title, track.artist, track.id); // Завантажуємо треки відповідного жанру в чергу
        }
    });
});

// Додаємо обробник події "load" до об'єкта window (при завантаженні сторінки)
window.addEventListener("load", () => {
    ppList.innerHTML = ""; // Очищаємо список треків
    tracks.forEach((track) => {
        trackLoad(track.img, track.title, track.artist, track.id); // Завантажуємо всі треки в чергу
    });
});
