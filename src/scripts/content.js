const contentImg = document.querySelector('.content-img');
const contentUserName = document.querySelector('.user-name');
const contentUserImg = document.querySelector('.user-img');


const btnLike = document.querySelector('.content-btn-like');
const amountLike = document.querySelector('.content-amount-like');
const btnMessages = document.querySelector('.content-btn-messages');
const amountMessages = document.querySelector('.content-amount-messages');
const btnShare = document.querySelector('.content-btn-share');
const amountShare = document.querySelector('.content-amount-share');


let ACTIVE_POST_ID = "6681dbd8be6effcd20c90f14"

/* const LoadContent = async() =>{
     const fetchContent = await fetch(`API/content/${JSON.parse(localStorage.token)}`)
     const dataJson = await fetchContent.json()
     console.log(dataJson)
    let img = dataJson[0].posts
    console.log(dataJson)
    let user = dataJson[1]
    let avatar = dataJson[2]
     function toBase64(arr) {
        return btoa(
            new Uint8Array(arr).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
    }

    try {
        const base64String = toBase64(img[0].data.data);
        contentImg.src = `data:${img.contentType};base64,${base64String}`;
        contentUserName.innerHTML = user
        console.log(avatar)
        const base64StringAvt = toBase64(avatar.data.data);
        contentUserImg.src = `data:${avatar.contentType};base64,${base64StringAvt}`;
        

    } catch (error) {
        console.log(error)
        contentImg.src = `https://as2.ftcdn.net/v2/jpg/03/49/49/79/1000_F_349497933_Ly4im8BDmHLaLzgyKg2f2yZOvJjBtlw5.jpg`;

    }




} */



    const LoadPost = async (reload) => {
        try {
            const response = await fetch(`API/content/post/${ACTIVE_POST_ID}`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            function toBase64(arr) {
                return btoa(
                    new Uint8Array(arr).reduce((data, byte) => data + String.fromCharCode(byte), '')
                );
            }
            const AllpostData = await response.json();
            let postData =  AllpostData[0]
            let userData = AllpostData[1]
            amountLike.innerHTML = postData.likes.length 
           amountShare.innerHTML = postData.shares.length 
            
            if(!reload){const base64StringUser = toBase64(userData.avatar.data.data);
            contentUserImg.src = `data:${userData.avatar.contentType};base64,${base64StringUser}`;
            const base64String = toBase64(postData.data.data);
            contentImg.src = `data:${postData.contentType};base64,${base64String}`;

            contentUserName.innerHTML = userData.username}
        } catch (error) {
            console.error("Failed to load post:", error);
        }
    };
    
    LoadPost();
    



btnLike.addEventListener("click", ()=>{
    btnLike.src = "../assets/icons/like-active.png"
    doAction("like")
    getPostDetails();


})
btnMessages.addEventListener("click", ()=>{
    amountMessages.innerHTML = 1  
})
btnShare.addEventListener("click", ()=>{
    amountShare.innerHTML = 1  
})
/* 
contentImg.addEventListener("dbclick",()=>{
    console.log("Double")
} )
 */

const doAction =(action)=>{
    fetch(`API/content/${action}/post/${ACTIVE_POST_ID}/${JSON.parse(localStorage.token)}`, {method: "POST"})
    LoadPost()
}
const getPostDetails = async () => {
    try {
        const response = await fetch(`API/content/${JSON.parse(localStorage.token)}/post/${ACTIVE_POST_ID}/`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error fetching post details:', error);
    }
}

