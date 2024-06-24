import { getUser } from "./getData.js";


const profileName = document.querySelector('.account-name');
const statsPosts = document.querySelector('.account-stats-posts');
const statsFollowers = document.querySelector('.account-stats-followers');
const statsFollowing = document.querySelector('.account-stats-following');


export const loadProfileData = ()=>{

    getUser().then(user=>{
        statsPosts.textContent = user.images.length + " posts"
        statsFollowers.textContent = user.stats.followers + " followers"
        statsFollowing.textContent = user.stats.following + " following"
        console.log(user)
    
    })
}

loadProfileData()