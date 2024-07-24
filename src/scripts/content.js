import { LoadView } from "./UI/view-post.js";

const API_BASE = 'API/content';
const postsContainer = document.getElementById('posts-container');
const loadingIndicator = document.createElement('div');
loadingIndicator.id = 'loading-indicator';
loadingIndicator.textContent = 'Loading...';
document.body.appendChild(loadingIndicator);

let isLoading = false;
let debounceTimer = null;
export let ACTIVE_POST_ID;

const toBase64 = (arr) => {
    if (!arr || !(arr instanceof Uint8Array)) {
        console.error('Invalid input for toBase64:', arr);
        return '';
    }
    return btoa(String.fromCharCode(...arr));
};

const fetchWithErrorHandling = async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    return response.json();
};

const fetchPost = async (postId) => fetchWithErrorHandling(`${API_BASE}/post/${postId}`);

const fetchNextPostID = async () => {
    const token = JSON.parse(localStorage.token);
    const data = await fetchWithErrorHandling(`${API_BASE}/nextPost/${token}`);
    return data.nextPostID;
};

const updatePostLikes = async (postData, postElement) => {
    const token = JSON.parse(localStorage.token).replace(/%22/g, '');
    const data = await fetchWithErrorHandling(`${API_BASE}/check/${postData._id}/${token}`);
    const likesCount = postElement.querySelector('.content-amount-like');
    const likeButton = postElement.querySelector('.content-btn-like');
    
    likesCount.textContent = data.likes.length;
    likeButton.src = data.liked ? "../assets/icons/like-active.png" : "../assets/icons/like.png";
};

const createPostElement = (postData, userData) => {
    if (!postData || !userData || !userData.avatar?.data?.data || !postData.data?.data) {
        console.error("Invalid data structure", { postData, userData });
        return null;
    }

    const postElement = document.createElement('div');
    postElement.classList.add('content-block');

    const likesCount = postData.likes?.length || 0;
    const commentsCount = postData.comments?.length || 0;
    const sharesCount = postData.shares?.length || 0;

    try {
        const userAvatarBase64 = toBase64(new Uint8Array(userData.avatar.data.data));
        const postContentBase64 = toBase64(new Uint8Array(postData.data.data));

        postElement.innerHTML = `
            <div class="user-block">
                <img src="data:${userData.avatar.contentType};base64,${userAvatarBase64}" alt="" class="user-img">
                <p class="user-name">${userData.username}</p>
            </div>
            <div class="content-frame-img">
                <img src="data:${postData.contentType};base64,${postContentBase64}" alt="" class="content-img lazyload">
            </div>
            <div class="content-controls">
                <div class="content-box">
                    <img src="../assets/icons/like.png" alt="" class="content-btn-like">
                    <p class="content-amount-like">${likesCount}</p>
                </div>
                <div class="content-box">
                    <img src="../assets/icons/messages.png" alt="" class="content-btn-messages">
                    <p class="content-amount-messages">${commentsCount}</p>
                </div>
            </div>
        `;

        updatePostLikes(postData, postElement);

        postElement.querySelector('.user-block').addEventListener('click', () => {
            location.href = `/${userData.username}`;
        });

        postElement.querySelector('.content-img').addEventListener('click', () => {
            LoadView(postData, userData.username, userData.avatar);
        });

        postElement.querySelector('.content-btn-like').addEventListener('click', async () => {
            await doAction('like', postData._id);
            updatePostLikes(postData, postElement);
        });
    } catch (error) {
        console.error('Error creating post element:', error);
    }

    return postElement;
};

const loadPost = async (postId) => {
    try {
        isLoading = true;
        loadingIndicator.style.display = 'block';

        const [postData, userData] = await fetchPost(postId);
        if (!postData || !userData) throw new Error(`Invalid data received.`);

        const postElement = createPostElement(postData, userData);
        if (postElement) postsContainer.appendChild(postElement);

        ACTIVE_POST_ID = await fetchNextPostID();
        localStorage.setItem('ACTIVE_POST_ID', ACTIVE_POST_ID);
    } catch (error) {
        console.error("Failed to load post:", error);
    } finally {
        isLoading = false;
        loadingIndicator.style.display = 'none';
    }
};

const doAction = async (action, postId, body = {}) => {
    try {
        const token = JSON.parse(localStorage.token);
        await fetch(`${API_BASE}/${action}/post/${postId}/${token}`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
    } catch (error) {
        console.error(`Failed to ${action} post:`, error);
    }
};

const debounce = (func, delay) => {
    return (...args) => {
        if (debounceTimer) cancelAnimationFrame(debounceTimer);
        debounceTimer = requestAnimationFrame(() => func.apply(this, args));
    };
};

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    try {
        ACTIVE_POST_ID = localStorage.getItem('ACTIVE_POST_ID') || await fetchNextPostID();
        await loadPost(ACTIVE_POST_ID);

        window.addEventListener('scroll', debounce(async () => {
            if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 2 && !isLoading) {
                await loadPost(ACTIVE_POST_ID);
            }
        }, 100));
    } catch (error) {
        console.error("Failed to initialize:", error);
    }
});
