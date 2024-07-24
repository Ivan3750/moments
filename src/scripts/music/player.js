let activeTrackIndex = 0;

window.addEventListener("load", () => {
    setTimeout(() => {
        let tracks = getTracksFromStorage();
        if (tracks.length > 0) {
            activeTrackIndex = tracks.length - 1;
            loadTrack(activeTrackIndex);
        }
    }, 500);
});

const getTracksFromStorage = () => {
    const tracks = sessionStorage.getItem('tracks');
    return tracks ? JSON.parse(tracks) : [];
};

const setTracksToStorage = (tracks) => {
    sessionStorage.setItem('tracks', JSON.stringify(tracks));
};

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
    console.log(tracks);
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

    if (tracks.length === 0) {
        console.error("Трек-лист порожній.");
        return;
    }

    if (index < 0 || index >= tracks.length) {
        console.error("Індекс треку виходить за межі трек-листа.");
        return;
    }

    const trackData = tracks[index];
    console.log(trackData);
    trackElement.src = trackData.previewUrl;
    trackArtist.textContent = trackData.artist;
    trackTitle.textContent = trackData.title;
    trackImg.src = trackData.imageUrl;
    ppImg.src = trackData.imageUrl;
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
    if (trackElement.duration) {
        progressBar.max = trackElement.duration;
        progressBar.value = trackElement.currentTime;
        currentTime.textContent = formatTime(trackElement.currentTime);
        durationTime.textContent = formatTime(trackElement.duration);
    }
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
