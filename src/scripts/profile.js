

import {getUserByUserName, getAvatar, getPhoto} from "./getData.js"


const profileName = document.querySelector('.account-name');
const statsPosts = document.querySelector('.account-stats-posts');
const statsFollowers = document.querySelector('.account-stats-followers');
const statsFollowing = document.querySelector('.account-stats-following');
const profileDescription = document.querySelector('.account-description');
const accountAvatar = document.querySelector('.account-avatar');




export const loadProfileData = ()=>{
    let usernameFromURL = (window.location.pathname).replace("/", "")
    getUserByUserName(usernameFromURL)
    .then(user=>{
        console.log(user)
        profileName.textContent = user.username
        profileDescription.textContent = user.description
        statsPosts.textContent = user.images.length + " posts"
        statsFollowers.textContent = user.stats.followers + " followers"
        statsFollowing.textContent = user.stats.following + " following"    
        getAvatar(user.avatar, accountAvatar)
        console.log(user.avatar, accountAvatar)
        getPhoto(usernameFromURL)
    })
   
    
 


}


loadProfileData()