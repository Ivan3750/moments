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
    getAvatar(user.avatar, avatarResult)
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



const checkJWT = async () => {
    const token = JSON.parse(localStorage.getItem('token')); // Assuming you store the token in localStorage
    
    try {
      if (!token) {
        throw new Error('No token found'); // Handle case where token is not present
      }
  
      const response = await fetch('/API/checkJWT', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Send token in the Authorization header
        }
      });
  
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      const data = await response.json();
      
    } catch (error) {
      // Handle network errors or other issues
    }
  }
  
  // Call the function to check the JWT token
  checkJWT();
  