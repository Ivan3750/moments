import { getUserByUserName, getAvatar, getPhoto, getUser } from "./getData.js"

const profileName = document.querySelector('.account-name');
const statsFollowers = document.querySelector('.account-stats-followers');
const statsFollowing = document.querySelector('.account-stats-following');
const profileDescription = document.querySelector('.account-description');
const accountAvatar = document.querySelector('.account-avatar');
const followBTN = document.querySelector('.account-btn-follow');

export const loadProfileData = async () => {
    try {
        const usernameFromURL = window.location.pathname.replace("/", "");
        const currentUser = await getUser();
        
        if (usernameFromURL === currentUser.username) {
            window.location.href = "/myprofile";
            return;
        }

        const user = await getUserByUserName(usernameFromURL);
        if (!user) throw new Error('User not found');

        profileName.textContent = user.username;
        profileDescription.textContent = user.description;
        statsFollowers.textContent = `${user.stats.followers.length} followers`;
        statsFollowing.textContent = `${user.stats.following.length} following`;
        
        getAvatar(user.avatar, accountAvatar);
        getPhoto(usernameFromURL);
        
        const followValue = await checkFollowFunc(usernameFromURL);
        updateFollowButton(followValue);
    } catch (error) {
        console.error("Error loading profile data:", error);
    }
};

const checkFollowFunc = async (username) => {
    try {
        const response = await fetch(`API/Checkfollow/${JSON.parse(localStorage.token)}/${username}`);
        const data = await response.json();
        return data.isFollowing;
    } catch (error) {
        console.error("Error checking follow status:", error);
        return false;
    }
};

const updateFollowButton = (isFollowing) => {
    if (isFollowing) {
        followBTN.classList.add("followed");
        followBTN.textContent = "Followed";
    } else {
        followBTN.classList.remove("followed");
        followBTN.textContent = "Follow";
    }
};

followBTN.addEventListener("click", async () => {
    try {
        const usernameFollow = window.location.pathname.replace("/", "");
        const followValue = await checkFollowFunc(usernameFollow);
        
        if (!followValue) {
            followBTN.classList.add("followed");
            followBTN.textContent = "Followed";
            await fetch(`API/follow/${JSON.parse(localStorage.token)}/${usernameFollow}`);
            const usernameFromURL = window.location.pathname.replace("/", "");
            const user = await getUserByUserName(usernameFromURL);
            statsFollowers.textContent = `${user.stats.followers.length} followers`;
        } else {
            followBTN.textContent = "Follow";
            followBTN.classList.remove("followed");
            await fetch(`API/unfollow/${JSON.parse(localStorage.token)}/${usernameFollow}`);
            const usernameFromURL = window.location.pathname.replace("/", "");
            const user = await getUserByUserName(usernameFromURL);
            statsFollowers.textContent = `${user.stats.followers.length} followers`;
        }
        
        console.log("Follow/unfollow action completed");
    } catch (error) {
        console.error("Error following/unfollowing user:", error);
    }
});

loadProfileData();
