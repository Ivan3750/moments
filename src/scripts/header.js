import { getUser, getAvatar } from "./getData.js";




const searchResult = document.querySelector('.search-result');
const searchInput = document.querySelector('.search-input');
const searchIcon = document.querySelector('.search-icon');

const accountImg = document.querySelector('.account-img'); 

accountImg.addEventListener("click", ()=>{
    window.location = "/myprofile"
})
window.addEventListener("load",()=>{
    getUser()
    .then(user=>{
        getAvatar(user.avatar, accountImg)
    })
})


// SEARCH

searchIcon.addEventListener("click", () => {
    searchUsers();
});
searchInput.addEventListener("input", () => {
    searchResult.classList.add("active")
    searchUsers();
});
window.addEventListener("click", (e) => {

    if (!searchResult.contains(e.target)) {
        searchResult.classList.remove("active");
    }
});




const searchUsers = () => {
    fetch(`http://localhost:5000/search/${searchInput.value}`)
        .then(response => response.json())
        .then(users => {
            if(users.length === 0){
                searchResult.innerHTML = "Nothing"
            }else{
                console.log(users);
                searchResult.innerHTML = ""
                users.forEach(user => {
                    resultBox(searchResult, user.username)
                });
            }
        })
        .catch(error => {
            console.error('Error fetching users:', error);
        });
};


const resultBox = (place, username) => {
    const divResult = document.createElement("div")
    divResult.classList = "result-box"
    const avatarResult = document.createElement("img")
    avatarResult.classList = "result-avatar"
    const usernameResult = document.createElement("p")
    usernameResult.innerHTML = username
    usernameResult.addEventListener("click", ()=>{
        const url = `/${encodeURIComponent(username)}`;

        location.href = url;
    })
    usernameResult.classList = "result-username"
    place.append(divResult)
    divResult.append(avatarResult, usernameResult)
}

