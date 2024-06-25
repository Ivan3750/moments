import { getUser, getPhoto, getAvatar} from "./getData.js";

const profileName = document.querySelector('.account-name');
const statsPosts = document.querySelector('.account-stats-posts');
const statsFollowers = document.querySelector('.account-stats-followers');
const statsFollowing = document.querySelector('.account-stats-following');
const profileDescription = document.querySelector('.account-description');
const posts = document.querySelector('.account-posts');
const accountAvatar = document.querySelector('.account-avatar');


accountAvatar.addEventListener("click", ()=>{
    
})




export const loadMyProfileData = ()=>{
    getUser()
    .then(user=>{
        profileName.textContent = user.username
        profileDescription.textContent = user.description
        statsPosts.textContent = user.images.length + " posts"
        statsFollowers.textContent = user.stats.followers.length + " followers"
        statsFollowing.textContent = user.stats.following.length + " following" 
        getPhoto(user.username)
        getAvatar(user.avatar, accountAvatar)
    })


}

loadMyProfileData()