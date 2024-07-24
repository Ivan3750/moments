import { getUser, setAvatar } from "../../scripts/getData.js";
import { getAUDIO } from "../../scripts/music/fetchMusic.js";

window.addEventListener("load", async () => {
    // Element selections
    const searchResult = document.querySelector('.search-result');
    const searchResultBox = document.querySelector('.search-result-box');
    const searchInput = document.querySelector('.search-input');
    const searchIcon = document.querySelector('.search-icon');
    const blurBackground = document.querySelector('.background-blur');
    const headerMenu = document.querySelector('.header__menu');
    const accountImg = document.querySelector('.account-img'); 
    const menuMyprofile = document.querySelector('.header__menu-myprofile');
    const menuLogout = document.querySelector('.header__menu-logout');
    const Category = document.querySelector('.Category');
    const UsersCategory = document.querySelector('#Users');
    const MusicCategory = document.querySelector('#Music');
    
    let ActiveCategory = window.location.pathname === "/music" ? "music" : "users";
    
    // Set up categories
    if (UsersCategory) {
        UsersCategory.addEventListener("click", () => toggleActiveCategory(UsersCategory, MusicCategory, "users"));
    }

    if (MusicCategory) {
        MusicCategory.addEventListener("click", () => toggleActiveCategory(MusicCategory, UsersCategory, "music"));
    }

    let avatar;

    // Convert array to Base64
    function toBase64(arr) {
        return btoa(
            new Uint8Array(arr).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
    }

    // Fetch user avatar
    async function fetchUserAvatar() {
        try {
            const user = await getUser();
            avatar = user.avatar;
            sessionStorage.setItem("avatar", JSON.stringify(avatar));
        } catch (error) {
            console.error('Error fetching user:', error);
        }
    }

    // Set avatar image
    function setAvatarImage(avatar) {
        if (avatar) {
            const base64String = toBase64(avatar.data.data);
            document.getElementById('accountImg').src = `data:${avatar.contentType};base64,${base64String}`;
        } else {
            document.getElementById('accountImg').src = `https://as2.ftcdn.net/v2/jpg/03/49/49/79/1000_F_349497933_Ly4im8BDmHLaLzgyKg2f2yZOvJjBtlw5.jpg`;
        }
    }

    // Initialize avatar
    if (sessionStorage.avatar && sessionStorage.avatar !== "undefined") {
        avatar = JSON.parse(sessionStorage.avatar);
    } else if (sessionStorage.avatar === "undefined") {
        console.log("Avatar not found");
    } else {
        await fetchUserAvatar();
    }

    setAvatarImage(avatar);

    // Set up event listeners
    if (accountImg) {
        accountImg.addEventListener("click", toggleMenu);
    }

    if (menuMyprofile) {
        menuMyprofile.addEventListener("click", () => navigateTo('/myprofile'));
    }

    if (menuLogout) {
        menuLogout.addEventListener("click", logout);
    }

    if (searchIcon) {
        searchIcon.addEventListener("click", search);
    }

    if (searchInput) {
        searchInput.addEventListener("input", showSearchResults);
    }

    window.addEventListener("click", (e) => {
        if (searchResult && !searchResult.contains(e.target) 
            && e.target !== accountImg 
            && e.target !== Category
            && e.target !== UsersCategory
            && e.target !== MusicCategory) {
            hideSearchResults();
        }
    });

    // Toggle active category
    function toggleActiveCategory(active, inactive, category) {
        if (active && inactive) {
            active.classList.add("active");
            inactive.classList.remove("active");
            ActiveCategory = category;
        }
    }

    // Toggle menu
    function toggleMenu() {
        if (blurBackground && headerMenu) {
            blurBackground.classList.toggle("active");
            headerMenu.classList.toggle("active");
        }
    }

    // Navigate to URL
    function navigateTo(url) {
        location.href = url;
    }

    // Logout user
    function logout() {
        localStorage.removeItem("token");
        sessionStorage.removeItem("avatar");
        location.href = "/auth";
    }

    // Perform search
    async function search() {
        if (ActiveCategory === "users") {
            await searchUsers();
        } else if (ActiveCategory === "music") {
            await searchMusic();
        }
    }

    // Search users
    async function searchUsers() {
        try {
            const response = await fetch(`API/search/${searchInput.value}`);
            if (response.status === 405) {
                throw new Error('Method Not Allowed');
            }
            const users = await response.json();
            displaySearchResults(users, resultBox);
        } catch (error) {
            console.error('Error fetching users:', error);
            searchResult.innerHTML = "Error fetching users";
        }
    }

    // Search music
    async function searchMusic() {
        try {
            const response = await fetch(`https://api.deezer.com/search?q=${searchInput.value}`);
            if (response.status === 404) {
                throw new Error('Not Found');
            }
            const data = await response.json();
            displaySearchResults(data.data, musicResultBox);
        } catch (error) {
            console.error('Error fetching music:', error);
            searchResult.innerHTML = "Error fetching music";
        }
    }

    // Display search results
    function displaySearchResults(data, createBox) {
        if (searchResult) {
            searchResult.innerHTML = "";
            if (data.length === 0) {
                searchResult.innerHTML = "Nothing found";
            } else {
                data.forEach(item => createBox(searchResult, item));
            }
            searchResult.classList.add("active");
            if (blurBackground) {
                blurBackground.classList.add("active");
            }
        }
    }

    // Create user result box
    function resultBox(place, user) {
        const divResult = document.createElement("div");
        divResult.classList.add("result-box");
        const avatarResult = document.createElement("img");
        avatarResult.classList.add("result-avatar");
        setAvatar(user.avatar, avatarResult);
        const usernameResult = document.createElement("p");
        usernameResult.innerHTML = user.username;
        divResult.addEventListener("click", () => navigateTo(`/${encodeURIComponent(user.username)}`));
        usernameResult.classList.add("result-username");
        place.append(divResult);
        divResult.append(avatarResult, usernameResult);
    }

    // Create music result box
    async function musicResultBox(place, track) {
        const divResult = document.createElement("div");
        divResult.classList.add("result-box");
        const albumCover = document.createElement("img");
        albumCover.classList.add("result-avatar");
        albumCover.src = track.album.cover;
        const trackTitle = document.createElement("p");
        trackTitle.innerHTML = track.title;
        divResult.addEventListener("click", async () => {
            const TrackToSend = {
                previewUrl: track.preview,
                artist: track.artist.name, 
                title: track.title, 
                imageUrl: track.album.cover_big,
                fullTrackUrl: await getAUDIO(track.title)
            };
            await sendToPlayerTrack(TrackToSend);
        });
        trackTitle.classList.add("result-username");
        place.append(divResult);
        divResult.append(albumCover, trackTitle);
    }

    // Show search results
    function showSearchResults() {
        if (searchResult) {
            searchResultBox.classList.add("active");
        }
        if (blurBackground) {
            blurBackground.classList.add("active");
        }
        search();
    }

    // Hide search results
    function hideSearchResults() {
        if (searchResult) {
            searchResultBox.classList.remove("active");
        }
        if (blurBackground) {
            blurBackground.classList.remove("active");
        }
        if (headerMenu) {
            headerMenu.classList.remove("active");
        }
    }

    // Initialize search functionality based on the active category
    if (pathname === "/music") {
        searchIcon.addEventListener("click", searchMusic);
        searchInput.addEventListener("input", searchMusic);
    } else {
        searchIcon.addEventListener("click", searchUsers);
        searchInput.addEventListener("input", searchUsers);
    }
});
