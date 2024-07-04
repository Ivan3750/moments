import { LoadView } from "./UI/view-post.js";

const postsContainer = document.getElementById('posts-container');
const loadingIndicator = document.createElement('div');
loadingIndicator.id = 'loading-indicator';
loadingIndicator.textContent = 'Loading...';
document.body.appendChild(loadingIndicator);

let isLoading = false;
let debounceTimer = null;

const toBase64 = (arr) => btoa(new Uint8Array(arr).reduce((data, byte) => data + String.fromCharCode(byte), ''));

const fetchPost = async (postId) => {
    const response = await fetch(`API/content/post/${postId}`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    return response.json();
};

const fetchNextPostID = async () => {
    const token = JSON.parse(localStorage.token);
    const response = await fetch(`API/content/nextPost/${token}`);
    if (!response.ok) {
        const Load = document.getElementById('loading-indicator');
        Load.textContent = 'No more posts for you...';
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data.nextPostID;
};

export let ACTIVE_POST_ID;

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
            <div class="content-box">
                <img src="../assets/icons/share.png" alt="" class="content-btn-share">
                <p class="content-amount-share">${sharesCount}</p>
            </div>
        </div>
    `;

    fetch(`API/content/check/${postData._id}/${JSON.parse(localStorage.token).replace(/%22/g, '')}`)
        .then(res => res.json())
        .then((data) => {
            postElement.querySelector('.content-amount-like').innerHTML = data.likes.length;
            postElement.querySelector('.content-btn-like').src = data.liked ? "../assets/icons/like-active.png" : "../assets/icons/like.png";
        })
        .catch(err => console.error('Error:', err));

    postElement.querySelector('.user-block').addEventListener('click', () => {
        location.href = `/${userData.username}`;
    });

    postElement.querySelector('.content-img').addEventListener('click', () => {
        LoadView(postData, userData.username, userData.avatar);
    });

    postElement.querySelector('.content-btn-like').addEventListener('click', async () => {
        const token = JSON.parse(localStorage.token).replace(/%22/g, '');
        try {
            const data = await (await fetch(`API/content/check/${postData._id}/${token}`)).json();
            postElement.querySelector('.content-amount-like').innerHTML = data.likes.length;
            postElement.querySelector('.content-btn-like').src = data.liked ? "../assets/icons/like-active.png" : "../assets/icons/like.png";
            await doAction('like', postData._id);
        } catch (err) {
            console.error('Error:', err);
        }
    });

    postElement.querySelector('.content-btn-share').addEventListener('click', async () => {
        await doAction('share', postData._id);
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
        localStorage.setItem('ACTIVE_POST_ID', ACTIVE_POST_ID); // Зберігаємо в LocalStorage

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
        await fetch(`API/content/${action}/post/${postId}/${JSON.parse(localStorage.token)}`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
    } catch (error) {
        console.error(`Failed to ${action} post:`, error);
    }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    ACTIVE_POST_ID = localStorage.getItem('ACTIVE_POST_ID') || await fetchNextPostID(); // Завантажуємо з LocalStorage або з API
    await loadPost(ACTIVE_POST_ID);

    window.addEventListener('scroll', async () => {
        if (debounceTimer) clearTimeout(debounceTimer);

        debounceTimer = setTimeout(async () => {
            if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 2 && !isLoading) {
                await loadPost(ACTIVE_POST_ID);
            }
        }, 100);
    });
});
