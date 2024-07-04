import { getUser, setPosts, setAvatar} from "./getData.js";

const profileName = document.querySelector('.account-name');
const statsPosts = document.querySelector('.account-stats-posts');
const statsFollowers = document.querySelector('.account-stats-followers');
const statsFollowing = document.querySelector('.account-stats-following');
const profileDescription = document.querySelector('.account-description');
const posts = document.querySelector('.account-posts');
const accountAvatar = document.querySelector('.account-avatar');
const post = document.querySelector('.post');




export const loadMyProfileData = ()=>{
    getUser()
    .then(user=>{
        console.log(user)
        profileName.textContent = user.username
        profileDescription.textContent = user.description
        statsFollowers.textContent = user.stats.followers.length + " followers"
        statsFollowing.textContent = user.stats.following.length + " following" 
        setPosts(user.username)
        setAvatar(user.avatar, accountAvatar)
    })


}
loadMyProfileData()