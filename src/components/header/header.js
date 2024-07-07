import { getUser, setAvatar } from "../../scripts/getData.js";


window.addEventListener("load", async () => {




    const searchResult = document.querySelector('.search-result');
    const searchInput = document.querySelector('.search-input');
    const searchIcon = document.querySelector('.search-icon');
    const blurBackground = document.querySelector('.background-blur');
    const headerMenu = document.querySelector('.header__menu');
    console.log(blurBackground)
    const accountImg = document.querySelector('.account-img'); 
    const menuMyprofile = document.querySelector('.header__menu-myprofile');
    const menuLogout = document.querySelector('.header__menu-logout');
    

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

    accountImg.addEventListener("click", () => {
        blurBackground.classList.add("active");
        headerMenu.classList.add("active");
    });


// SEARCH

menuMyprofile.addEventListener("click", ()=>{
    location.href = "/myprofile"
})
menuLogout.addEventListener("click", ()=>{
    location.href = "/auth"
    localStorage.removeItem("token")
    sessionStorage.removeItem("avatar")
})

searchIcon.addEventListener("click", () => {
    searchUsers();
});
searchInput.addEventListener("input", () => {
    searchResult.classList.add("active")
    blurBackground.classList.add("active")
    searchUsers();
});
window.addEventListener("click", (e) => {
    if (!searchResult.contains(e.target) && e.target !== accountImg) {
        searchResult.classList.remove("active");
        blurBackground.classList.remove("active");
        headerMenu.classList.remove("active");

    }
});




const searchUsers = () => {
    fetch(`API/search/${searchInput.value}`)
        .then(response => response.json())
        .then(users => {
            if(users.length === 0){
                searchResult.innerHTML = "Nothing"
            }else{
                searchResult.innerHTML = ""
                users.forEach(user => {
                    resultBox(searchResult, user)
                });
            }
        })
    
};


const resultBox = (place, user) => {
    
    const divResult = document.createElement("div")
    divResult.classList = "result-box"
    const avatarResult = document.createElement("img")
    avatarResult.classList = "result-avatar"
    setAvatar(user.avatar, avatarResult)
    const usernameResult = document.createElement("p")
    usernameResult.innerHTML = user.username
    divResult.addEventListener("click", ()=>{
        const url = `/${encodeURIComponent(user.username)}`;

        location.href = url;
    })
    usernameResult.classList = "result-username"
    place.append(divResult)
    divResult.append(avatarResult, usernameResult)
}
});
