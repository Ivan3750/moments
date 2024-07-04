import { getUserByUserName } from "../getData.js";

const ViewImg = document.querySelector('.view-post-img');
const ViewAvatar = document.querySelector('.view-post-avatar');
const ViewUserName = document.querySelector('.view-post-username');
const ViewClose = document.querySelector('.view-close');
const ViewModal = document.querySelector('.view-block-conteiner');
const commentInput = document.querySelector('#comment-input');
const commentSend = document.querySelector('.view-post-send-comment');
const ViewPostBody = document.querySelector('.view-post-body');

const fetchPost = async (postId) => {
    const response = await fetch(`API/content/post/${postId}`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    return response.json();
};

export const LoadView = (postData, username, avatar) => { 
    function toBase64(arr) {
        return btoa(new Uint8Array(arr).reduce((data, byte) => data + String.fromCharCode(byte), ''));
    }
    ViewModal.classList.add("active");
    LoadComments(postData._id);
    console.log(postData._id);
    
    const base64PostImg = toBase64(postData.data.data);
    ViewImg.src = `data:${postData.contentType};base64,${base64PostImg}`;
    ViewUserName.innerHTML = username;
    const base64UserAvatar = toBase64(avatar.data.data);
    ViewAvatar.src = `data:${avatar.contentType};base64,${base64UserAvatar}`;
};

ViewClose.addEventListener("click", () => {
    ViewModal.classList.remove("active");
});

commentSend.addEventListener("click", async () => {
    try {
        let postId = localStorage.getItem('ACTIVE_POST_ID');
        const sendData = {
            comment: commentInput.value
        };
        await fetch(`API/content/comment/post/${postId}/${JSON.parse(localStorage.token)}`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sendData)
        });
        LoadComments(postId);
        commentInput.value = "";
    } catch (error) {
        console.error(`Failed to post:`, error);
    }
});

const LoadComments = async (postID) => {
    try {
        console.log("Loading Comments...");
        const response = await fetch(`/API/content/comment/${postID}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log(data);
        ViewPostBody.innerHTML = "";
        data.forEach(comment => {
            function toBase64(arr) {
                return btoa(new Uint8Array(arr).reduce((data, byte) => data + String.fromCharCode(byte), ''));
            }
            getUserByUserName(comment.username)
            .then((user) => {
                const base64UserAvatar = toBase64(user.avatar.data.data);
                let src = `data:${user.avatar.contentType};base64,${base64UserAvatar}`;
                console.log(user);
                ViewPostBody.innerHTML += `
                    <div class="comment">
                        <div class="comment-img">
                            <img src="${src}" alt="" class="avatar-comment">
                        </div>
                        <div class="comment-details">
                            <p class="comment-username">@${comment.username}</p>
                            <p class="comment-text">${comment.comments}</p>
                        </div>
                    </div>`;
            });
        });
    } catch (error) {
        console.error('Error loading comments:', error);
        alert('Failed to load comments');
    }
};
