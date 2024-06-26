

import {getUserByUserName, getAvatar, getPhoto, getUser} from "./getData.js"


const profileName = document.querySelector('.account-name');
 const statsPosts = document.querySelector('.account-stats-posts');
const statsFollowers = document.querySelector('.account-stats-followers');
const statsFollowing = document.querySelector('.account-stats-following');
const profileDescription = document.querySelector('.account-description');
const accountAvatar = document.querySelector('.account-avatar');
const followBTN = document.querySelector('.account-btn-follow');



export const loadProfileData = ()=>{
    let usernameFromURL = (window.location.pathname).replace("/", "")
    getUser()
    .then(user=>{
    if(usernameFromURL === user.username){
        window.location.href = "/myprofile"
    }else{
    getUserByUserName(usernameFromURL)
    .then(user=>{
        console.log(user)
        profileName.textContent = user.username
        profileDescription.textContent = user.description
        statsPosts.textContent = user.images.length + " posts"
        statsFollowers.textContent = user.stats.followers.length + " followers"
        statsFollowing.textContent = user.stats.following.length + " following"    
        getAvatar(user.avatar, accountAvatar)
        getPhoto(usernameFromURL)
    })
}
    
})

}




loadProfileData()



followBTN.addEventListener("click", ()=>{
    let usernameFollow = (window.location.pathname).replace("/", "")
    const response = fetch(`/follow/${JSON.parse(localStorage.user).email}/${usernameFollow}`)
    console.log(response)
})