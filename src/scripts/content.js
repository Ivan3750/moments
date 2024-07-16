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

const toBase64 = (arr) => btoa(new Uint8Array(arr).reduce((data, byte) => data + String.fromCharCode(byte), ''));

const fetchWithErrorHandling = async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    return response.json();
};

const fetchPost = async (postId) => {
    return fetchWithErrorHandling(`${API_BASE}/post/${postId}`);
};

const fetchNextPostID = async () => {
    const token = JSON.parse(localStorage.token);
    const data = await fetchWithErrorHandling(`${API_BASE}/nextPost/${token}`);
    return data.nextPostID;
};

const updatePostLikes = async (postData, postElement) => {
    const token = JSON.parse(localStorage.token).replace(/%22/g, '');
    const data = await fetchWithErrorHandling(`${API_BASE}/check/${postData._id}/${token}`);
    postElement.querySelector('.content-amount-like').textContent = data.likes.length;
    postElement.querySelector('.content-btn-like').src = data.liked ? "../assets/icons/like-active.png" : "../assets/icons/like.png";
};

const createPostElement = (postData, userData) => {
    if (!postData || !userData) {
        console.error("Invalid postData or userData", postData, userData);
        return null;
    }

    const postElement = document.createElement('div');
    postElement.classList.add('content-block');

    const likesCount = postData.likes ? postData.likes.length : 0;
    const commentsCount = postData.comments ? postData.comments.length : 0;
    const sharesCount = postData.shares ? postData.shares.length : 0;

    postElement.innerHTML = `
        <div class="user-block">
            <img src="data:${userData.avatar.contentType};base64,${toBase64(userData.avatar.data.data)}" alt="" class="user-img">
            <p class="user-name">${userData.username}</p>
        </div>
        <div class="content-frame-img">
            <img src="data:${postData.contentType};base64,${toBase64(postData.data.data)}" alt="" class="content-img lazyload">
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

    return postElement;
};

const loadPost = async (postId) => {
    try {
        isLoading = true;
        loadingIndicator.style.display = 'block';

        const [postData, userData] = await fetchPost(postId);
        const postElement = createPostElement(postData, userData);

        if (postElement) {
            postsContainer.appendChild(postElement);
        }

        ACTIVE_POST_ID = await fetchNextPostID();
        localStorage.setItem('ACTIVE_POST_ID', ACTIVE_POST_ID);

        isLoading = false;
        loadingIndicator.style.display = 'none';
    } catch (error) {
        console.error("Failed to load post:", error);
        isLoading = false;
        loadingIndicator.style.display = 'none';
    }
};

const doAction = async (action, postId, body = {}) => {
    try {
        await fetch(`${API_BASE}/${action}/post/${postId}/${JSON.parse(localStorage.token)}`, {
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
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(this, args), delay);
    };
};

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    ACTIVE_POST_ID = localStorage.getItem('ACTIVE_POST_ID') || await fetchNextPostID();
    await loadPost(ACTIVE_POST_ID);

    window.addEventListener('scroll', debounce(async () => {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 2 && !isLoading) {
            await loadPost(ACTIVE_POST_ID);
        }
    }, 100));
});
