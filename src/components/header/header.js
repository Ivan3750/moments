import { getUser, setAvatar } from "../../scripts/getData.js";




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
        setAvatar(user.avatar, accountImg)
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
