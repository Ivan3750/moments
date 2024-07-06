const tabs = document.querySelectorAll('.tab');

window.addEventListener("load", () => {
    const modal = document.querySelector(".modal-create");
    const tabHome = document.querySelector('.tab-home');
    const tabNotifications = document.querySelector('.tab-notifications');
    const tabMessages = document.querySelector('.tab-messages');
    const tabMusic = document.querySelector('.tab-music');
    const tabCreate = document.querySelector('.tab-create');
    const tabSettings = document.querySelector('.tab-settings');
    
    const imgHome = document.querySelector('#img-home');
    const imgNotifications = document.querySelector('#img-notifications');
    const imgMessages = document.querySelector('#img-messages');
    const imgCreate = document.querySelector('#img-create');
    const imgSettings = document.querySelector('#img-settings');

    let activeTab; //export

    const inactiveTab = () => {
        imgHome.src = "../assets/icons/home.png";
        imgNotifications.src = "../assets/icons/like.png";
        imgMessages.src = "../assets/icons/messages.png";
        tabMusic.src = "../assets/icons/music.png";
        imgCreate.src = "../assets/icons/add.png";
        imgSettings.src = "../assets/icons/settings.png";
    };

    tabHome.addEventListener("click", () => {
        inactiveTab();
        imgHome.src = "../assets/icons/home-active.png";
        activeTab = "home";
        window.location.href = "/home";
    });

    tabNotifications.addEventListener("click", () => {
        inactiveTab();
        imgNotifications.src = "../assets/icons/like-active.png";
        activeTab = "notifications";
    });

    tabMessages.addEventListener("click", () => {
        inactiveTab();
        imgMessages.src = "../assets/icons/messages-active.png";
        activeTab = "messages";
    });
  

    tabCreate.addEventListener("click", () => {
        inactiveTab();
        imgCreate.src = "../assets/icons/add-active.png";
        activeTab = "create";
        setTimeout(() => {
            imgCreate.src = "../assets/icons/add.png";
        }, 300);
        modal.classList.add("show");
    });

    tabSettings.addEventListener("click", () => {
        inactiveTab();
        imgSettings.src = "../assets/icons/settings-active.png";
        activeTab = "settings";
    });
});
