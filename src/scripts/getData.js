const accountAvatar = document.querySelector('.account-avatar');
const posts = document.querySelector('.account-posts');


export const getUser = async () => {
    const email = JSON.parse(localStorage.getItem('user')).email;
    try {
        const response = await fetch(`/user/${email}`);
        const user = await response.json();
        return user;
    } catch (error) {
        return null;
    }
 };
export const getUserByUserName = async (value) => {
    try {
        const response = await fetch(`/username/${value}`);
        const user = await response.json();
        return user;
    } catch (error) {
        return null;
    }
}; 



export const getPhoto = (usernameFromURL)=>{
    fetch(`/photos/${usernameFromURL}`)
    .then(res => res.json())
    .then(data => {
        posts.innerHTML = ""
        if(data.length !== 0){
            function toBase64(arr) {
                return btoa(
                    new Uint8Array(arr).reduce((data, byte) => data + String.fromCharCode(byte), '')
                );
            }
    
            data.forEach(image => {
                const imgElement = document.createElement('img');
                imgElement.src = `data:${image.contentType};base64,${toBase64(image.data.data)}`;
                imgElement.className = 'post';
                posts.prepend(imgElement);
            });
        }else{
            const notImg = document.createElement("p")
            notImg.textContent = "No images"
            posts.prepend(notImg)

        }

       
    })
    
}

export const getAvatar = (avatar, InAvatar) => {
    function toBase64(arr) {
        return btoa(
            new Uint8Array(arr).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
    }

    try {
        const base64String = toBase64(avatar.data.data);
        InAvatar.src = `data:${avatar.contentType};base64,${base64String}`;
    } catch (error) {

        InAvatar.src = `https://as2.ftcdn.net/v2/jpg/03/49/49/79/1000_F_349497933_Ly4im8BDmHLaLzgyKg2f2yZOvJjBtlw5.jpg`;

    }
}