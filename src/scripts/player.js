let activeTrackIndex = 0;

const getTracksFromStorage = () => {
    const tracks = sessionStorage.getItem('tracks');
    return tracks ? JSON.parse(tracks) : [];
}

const setTracksToStorage = (tracks) => {
    sessionStorage.setItem('tracks', JSON.stringify(tracks));
}

export const sendToPlayerTrack = (track) => {
    if (!track.previewUrl || !track.artist || !track.title || !track.imageUrl) {
        console.error("Недостатньо інформації для завантаження треку:", track);
        return;
    }

    let tracks = getTracksFromStorage();
    tracks.push(track);
    setTracksToStorage(tracks);
    activeTrackIndex = tracks.length - 1;
    loadTrack(activeTrackIndex);
    console.log(tracks)
};

// DOM Elements
const likeTrack = document.querySelector('.like-track-img');
const trackElement = document.getElementById("track");
const trackArtist = document.getElementById("track-artist");
const trackTitle = document.getElementById("track-title");
const progressBar = document.getElementById("progressBar");
const currentTime = document.getElementById("currentTime");
const durationTime = document.getElementById("durationTime");
const trackImg = document.querySelector(".img-track");
const ppImg = document.querySelector(".player-page-img");
const volumeBar = document.querySelector('#volumeBar');
const track = document.querySelector('track');

const playButton = document.getElementById("play");
const pauseButton = document.getElementById("pause");
const nextButton = document.getElementById("next-track");
const prevButton = document.getElementById("prev-track");
const stopButton = document.getElementById("stop");
const backButton = document.getElementById("back10");
const forwardButton = document.getElementById("forward10");

let playing = false;

function loadTrack(index) {
    let tracks = getTracksFromStorage();
    console.log(tracks);
    if (tracks.length === 0) {
        console.error("Трек-лист порожній.");
        return;
    }

    if (index < 0 || index >= tracks.length) {
        console.error("Індекс треку виходить за межі трек-листа.");
        return;
    }

    const trackData = tracks[index];
    trackElement.src = trackData.previewUrl;
    trackArtist.textContent = trackData.artist;
    trackTitle.textContent = trackData.title;
    trackImg.src = trackData.imageUrl;
    ppImg.src = trackData.imageUrl;
   /*  track.src = trackData.fullTrackUrl */
    updateProgress();
}

function playPauseTrack() {
    if (playing) {
        trackElement.pause();
    } else {
        trackElement.play();
    }
    playing = !playing;
    togglePlayPauseButtons();
}

function togglePlayPauseButtons() {
    playButton.style.display = playing ? "none" : "flex";
    pauseButton.style.display = playing ? "flex" : "none";
}

function updateProgress() {
    progressBar.max = trackElement.duration || 0;
    progressBar.value = trackElement.currentTime || 0;
    currentTime.textContent = formatTime(trackElement.currentTime);
    durationTime.textContent = isNaN(trackElement.duration) ? "0:00" : formatTime(trackElement.duration);
}

function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

function stopTrack() {
    trackElement.pause();
    trackElement.currentTime = 0;
    playing = false;
    togglePlayPauseButtons();
}

function changeTrack(direction) {
    let tracks = getTracksFromStorage();
    activeTrackIndex = (activeTrackIndex + direction + tracks.length) % tracks.length;
    loadTrack(activeTrackIndex);
    if (playing) {
        trackElement.play();
    }
}

function skip(seconds) {
    trackElement.currentTime += seconds;
}

function setProgress() {
    trackElement.currentTime = progressBar.value;
}

playButton.addEventListener("click", playPauseTrack);
pauseButton.addEventListener("click", playPauseTrack);
prevButton.addEventListener("click", () => changeTrack(-1));
nextButton.addEventListener("click", () => changeTrack(1));
progressBar.addEventListener("input", setProgress);
trackElement.addEventListener("timeupdate", updateProgress);
trackElement.addEventListener("ended", () => changeTrack(1));
volumeBar.addEventListener("input", () => {
    trackElement.volume = volumeBar.value * 0.01;
});

/* backButton.addEventListener("click", () => skip(-10));
forwardButton.addEventListener("click", () => skip(10));
stopButton.addEventListener("click", stopTrack); */

/* 
let trackIndex = 0; // Індекс поточного треку
let playing = false; // Статус відтворення

// Функція перевірки, чи є трек улюбленим
const checkTrackLike = (track) => {
    let favoriteTracks = getFavoriteTracks(); // Отримуємо улюблені треки
    return favoriteTracks.some(favTrack => favTrack.id === track.id); // Перевіряємо, чи є поточний трек у списку улюблених
};

// Функція завантаження треку
function loadTrack(index) {
    if (tracks.length === 0) {
        console.error("Трек-лист порожній.");
        return;
    }

    if (index < 0 || index >= tracks.length) {
        console.error("Індекс треку виходить за межі трек-листа.");
        return;
    }

    const trackData = tracks[index];
    
    if (!trackData.previewUrl) {
        console.error("Трек не має previewUrl:", trackData);
        return;
    }

    track.src = trackData.previewUrl; // Встановлюємо джерело аудіо
    trackArtist.textContent = trackData.artist; // Встановлюємо ім'я виконавця
    trackTitle.textContent = trackData.title; // Встановлюємо назву треку
    trackImg.src = trackData.imageUrl; // Встановлюємо зображення треку
    ppImg.src = trackData.imageUrl; // Встановлюємо зображення треку на сторінці плеєра
    updateProgress(); // Оновлюємо прогрес
}

// Функція відтворення/пауза треку
function playPauseTrack() {
    if (playing) {
        console.log("pause");
        track.pause(); // Ставимо на паузу
        play.style.display = "flex"; // Відображаємо кнопку відтворення
        pause.style.display = "none"; // Приховуємо кнопку паузи
    } else {
        console.log("play");
        track.play(); // Відтворюємо трек
        play.style.display = "none"; // Приховуємо кнопку відтворення
        pause.style.display = "flex"; // Відображаємо кнопку паузи
    }
    playing = !playing; // Змінюємо статус відтворення
}

// Функція зупинки треку
function stopTrack() {
    track.pause(); // Ставимо на паузу
    track.currentTime = 0; // Скидаємо час відтворення
    play.style.display = "flex"; // Відображаємо кнопку відтворення
    pause.style.display = "none"; // Приховуємо кнопку паузи
    playing = false; // Встановлюємо статус відтворення на false
}

// Функція зміни треку
function changeTrack(direction) {
    if (tracks.length === 0) return; // Перевірка наявності треків

    trackIndex = (trackIndex + direction + tracks.length) % tracks.length; // Обчислюємо новий індекс треку
    loadTrack(trackIndex); // Завантажуємо новий трек
    updateProgress(); // Оновлюємо прогрес
    if (playing) track.play(); // Якщо трек відтворюється, продовжуємо відтворення
}

// Функція перемотування треку
function skip(seconds) {
    track.currentTime += seconds; // Змінюємо поточний час відтворення
}

// Функція оновлення прогресу
function updateProgress() {
    progressBar.max = track.duration; // Встановлюємо максимальне значення прогрес-бару
    progressBar.value = track.currentTime; // Оновлюємо поточне значення прогрес-бару
    currentTime.textContent = formatTime(track.currentTime); // Оновлюємо поточний час
    durationTime.textContent = isNaN(track.duration) ? "0:00" : formatTime(track.duration); // Оновлюємо тривалість треку
}

// Функція встановлення прогресу
function setProgress() {
    track.currentTime = progressBar.value; // Встановлюємо поточний час відтворення
}

// Функція форматування часу
function formatTime(seconds) {
    const min = Math.floor(seconds / 60); // Обчислюємо хвилини
    const sec = Math.floor(seconds % 60); // Обчислюємо секунди
    return `${min}:${sec < 10 ? '0' : ''}${sec}`; // Форматуємо час у форматі mm:ss
}

// Додаємо обробники подій для керування плеєром
if (play && pause && stop && prev && next && back && forward && progressBar && track) {
    play.addEventListener("click", playPauseTrack); // Відтворення/пауза при натисканні кнопки відтворення
    pause.addEventListener("click", playPauseTrack); // Відтворення/пауза при натисканні кнопки паузи
    stop.addEventListener("click", stopTrack); // Зупинка при натисканні кнопки зупинки
    prev.addEventListener("click", () => changeTrack(-1)); // Попередній трек при натисканні кнопки попереднього треку
    next.addEventListener("click", () => changeTrack(1)); // Наступний трек при натисканні кнопки наступного треку
    back.addEventListener("click", () => skip(-10)); // Перемотка назад на 10 секунд при натисканні кнопки перемотки назад
    forward.addEventListener("click", () => skip(10)); // Перемотка вперед на 10 секунд при натисканні кнопки перемотки вперед
    progressBar.addEventListener("input", setProgress); // Встановлення прогресу при зміні значення прогрес-бару
    track.addEventListener("timeupdate", updateProgress); // Оновлення прогресу при зміні часу відтворення треку
    track.addEventListener("ended", () => changeTrack(1)); // Наступний трек при закінченні поточного треку
}

loadTrack(trackIndex); // Завантаження початкового треку

const openPP = document.querySelector('.img-open-pp'); // Знаходимо елемент для відкриття сторінки плеєра
const playerPage = document.querySelector('.player-page'); // Знаходимо сторінку плеєра
const body = document.body; // Знаходимо елемент body для керування прокруткою
const player = document.querySelector('.player'); // Знаходимо елемент плеєра

// Додаємо обробник події для відкриття/закриття сторінки плеєра
if (openPP) {
    openPP.addEventListener("click", () => {
        if (playerPage.classList.contains("show")) {
            playerPage.classList.remove("show"); // Закриваємо сторінку плеєра
            openPP.classList.remove("show"); // Закриваємо елемент для відкриття сторінки плеєра
            body.style.overflow = "visible"; // Відновлюємо прокрутку
            if (window.screen.availWidth <= 768) {
                player.classList.remove("show"); // Приховуємо плеєр для мобільних пристроїв
            }
        } else {
            playerPage.classList.add("show"); // Відкриваємо сторінку плеєра
            openPP.classList.add("show"); // Відкриваємо елемент для відкриття сторінки плеєра
            body.style.overflow = "hidden"; // Забороняємо прокрутку
            if (window.screen.availWidth <= 768) {
                player.classList.add("show"); // Відображаємо плеєр для мобільних пристроїв
            }
        }
    });
}

// Функція отримання улюблених треків
function getFavoriteTracks() {
    const favoriteTracks = localStorage.getItem('favoriteTracks'); // Отримуємо улюблені треки з localStorage
    return favoriteTracks ? JSON.parse(favoriteTracks) : []; // Повертаємо розпарсені треки або пустий масив, якщо улюблених треків немає
}

// Функція збереження улюблених треків
function saveFavoriteTracks(favoriteTracks) {
    localStorage.setItem('favoriteTracks', JSON.stringify(favoriteTracks)); // Зберігаємо улюблені треки у localStorage
}

// Функція перемикання статусу улюбленого треку
function toggleFavorite() {
    let favoriteTracks = getFavoriteTracks(); // Отримуємо улюблені треки
    const isFavorite = favoriteTracks.some(favTrack => favTrack.id === tracks[trackIndex].id); // Перевіряємо, чи є поточний трек улюбленим
    if (isFavorite) {
        favoriteTracks = favoriteTracks.filter(favTrack => favTrack.id !== tracks[trackIndex].id); // Видаляємо трек зі списку улюблених
        likeTrack.src = "../assets/icons/like-active.png"; // Змінюємо іконку на серце
    } else {
        const favoriteTrack = {
            id: tracks[trackIndex].id, // Додаємо ID треку
            url: tracks[trackIndex].previewUrl, // Додаємо URL треку
            artist: trackArtist.textContent, // Додаємо ім'я виконавця
            title: trackTitle.textContent, // Додаємо назву треку
            imageUrl: tracks[trackIndex].imageUrl // Додаємо зображення треку
        };
        favoriteTracks.push(favoriteTrack); // Додаємо трек до списку улюблених
        likeTrack.src = "../assets/icons/like.png"; // Змінюємо іконку на лайк
    }
    saveFavoriteTracks(favoriteTracks); // Зберігаємо оновлений список улюблених треків
}

// Додаємо обробник події для перемикання статусу улюбленого треку
if (likeTrack) {
    likeTrack.addEventListener("click", () => {
        toggleFavorite();
    });
}

// Додаємо обробник події для змінни гучності треку
if (volumeBar) {
    volumeBar.addEventListener("input", () => {
        track.volume = volumeBar.value * 0.01; // Встановлюємо гучність треку відповідно до значення шкали гучності (0-100).
    });
}
 */