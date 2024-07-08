import { getUser, setAvatar } from "../../scripts/getData.js";

window.addEventListener("load", async () => {
    const searchResult = document.querySelector('.search-result');
    const searchInput = document.querySelector('.search-input');
    const searchIcon = document.querySelector('.search-icon');
    const blurBackground = document.querySelector('.background-blur');
    const headerMenu = document.querySelector('.header__menu');
    const accountImg = document.querySelector('.account-img'); 
    const menuMyprofile = document.querySelector('.header__menu-myprofile');
    const menuLogout = document.querySelector('.header__menu-logout');
    const UsersCategory = document.querySelector('#Users');
    const MusicCategory = document.querySelector('#Music');
    let ActiveCategory = "music";

    if (UsersCategory) {
        UsersCategory.addEventListener("click", () => {
            toggleActiveCategory(UsersCategory, MusicCategory, "users");
        });
    }

    if (MusicCategory) {
        MusicCategory.addEventListener("click", () => {
            toggleActiveCategory(MusicCategory, UsersCategory, "music");
        });
    }

    let avatar;

    function toBase64(arr) {
        return btoa(
            new Uint8Array(arr).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
    }

    async function fetchUserAvatar() {
        try {
            const user = await getUser();
            avatar = user.avatar;
            sessionStorage.setItem("avatar", JSON.stringify(avatar));
        } catch (error) {
            console.error('Error fetching user:', error);
        }
    }

    function setAvatarImage(avatar) {
        try {
            const base64String = toBase64(avatar.data.data);
            document.getElementById('accountImg').src = `data:${avatar.contentType};base64,${base64String}`;
        } catch (error) {
            console.error('Error setting avatar image:', error);
            document.getElementById('accountImg').src = `https://as2.ftcdn.net/v2/jpg/03/49/49/79/1000_F_349497933_Ly4im8BDmHLaLzgyKg2f2yZOvJjBtlw5.jpg`;
        }
    }

    if (sessionStorage.avatar) {
        avatar = JSON.parse(sessionStorage.avatar);
    } else {
        await fetchUserAvatar();
    }

    setAvatarImage(avatar);

    if (accountImg) {
        accountImg.addEventListener("click", () => {
            toggleMenu();
        });
    }

    if (menuMyprofile) {
        menuMyprofile.addEventListener("click", () => {
            navigateTo('/myprofile');
        });
    }

    if (menuLogout) {
        menuLogout.addEventListener("click", () => {
            logout();
        });
    }

    if (searchIcon) {
        searchIcon.addEventListener("click", () => {
            search();
        });
    }

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            showSearchResults();
        });
    }

    window.addEventListener("click", (e) => {
        if (searchResult && !searchResult.contains(e.target) && e.target !== accountImg) {
            hideSearchResults();
        }
    });

    function toggleActiveCategory(active, inactive, category) {
        if (active && inactive) {
            active.classList.add("active");
            inactive.classList.remove("active");
            ActiveCategory = category;
        }
    }

    function toggleMenu() {
        if (blurBackground && headerMenu) {
            blurBackground.classList.toggle("active");
            headerMenu.classList.toggle("active");
        }
    }

    function navigateTo(url) {
        location.href = url;
    }

    function logout() {
        location.href = "/auth";
        localStorage.removeItem("token");
        sessionStorage.removeItem("avatar");
    }

    function search() {
        if (ActiveCategory === "users") {
            searchUsers();
        } else if (ActiveCategory === "music") {
            searchMusic();
        }
    }

    function searchUsers() {
        fetch(`API/search/${searchInput.value}`)
            .then(response => {
                if (response.status === 405) {
                    throw new Error('Method Not Allowed');
                }
                return response.json();
            })
            .then(users => {
                displaySearchResults(users, resultBox);
            })
            .catch(error => {
                console.error('Error fetching users:', error);
                searchResult.innerHTML = "Error fetching users";
            });
    }

    function searchMusic() {
        fetch(`https://api.deezer.com/search?q=${searchInput.value}`)
            .then(response => {
                if (response.status === 404) {
                    throw new Error('Not Found');
                }
                return response.json();
            })
            .then(data => {
                displaySearchResults(data.data, musicResultBox);
            })
            .catch(error => {
                console.error('Error fetching music:', error);
                searchResult.innerHTML = "Error fetching music";
            });
    }

    function displaySearchResults(data, createBox) {
        if (searchResult) {
            searchResult.innerHTML = "";
            if (data.length === 0) {
                searchResult.innerHTML = "Nothing";
            } else {
                data.forEach(item => {
                    createBox(searchResult, item);
                });
            }
            searchResult.classList.add("active");
            if (blurBackground) {
                blurBackground.classList.add("active");
            }
        }
    }

    function resultBox(place, user) {
        const divResult = document.createElement("div");
        divResult.classList.add("result-box");
        const avatarResult = document.createElement("img");
        avatarResult.classList.add("result-avatar");
        setAvatar(user.avatar, avatarResult);
        const usernameResult = document.createElement("p");
        usernameResult.innerHTML = user.username;
        divResult.addEventListener("click", () => {
            navigateTo(`/${encodeURIComponent(user.username)}`);
        });
        usernameResult.classList.add("result-username");
        place.append(divResult);
        divResult.append(avatarResult, usernameResult);
    }

    function musicResultBox(place, track) {
        const divResult = document.createElement("div");
        divResult.classList.add("result-box");
        const albumCover = document.createElement("img");
        albumCover.classList.add("result-avatar");
        albumCover.src = track.album.cover;
        const trackTitle = document.createElement("p");
        trackTitle.innerHTML = track.title;
        divResult.addEventListener("click", () => {
            window.open(track.link, '_blank');
        });
        trackTitle.classList.add("result-username");
        place.append(divResult);
        divResult.append(albumCover, trackTitle);
    }

    function showSearchResults() {
        if (searchResult) {
            searchResult.classList.add("active");
        }
        if (blurBackground) {
            blurBackground.classList.add("active");
        }
        search();
    }

    function hideSearchResults() {
        if (searchResult) {
            searchResult.classList.remove("active");
        }
        if (blurBackground) {
            blurBackground.classList.remove("active");
        }
        if (headerMenu) {
            headerMenu.classList.remove("active");
        }
    }
});
