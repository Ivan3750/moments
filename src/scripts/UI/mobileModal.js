const mobileMenuImg = document.querySelector('.mobile-menu');
const closeMobile = document.querySelector('.closeMobile-modal');
const headerNav = document.querySelector('.header__nav');
const body = document.querySelector('.body');

console.log("connect")
mobileMenuImg.addEventListener("click", ()=>{
    alert("work")
    headerNav.classList.add("mobileMode")
    headerNav.style.display = "flex"
    closeMobile.classList.add("show")
    body.style.overflow = "hidden"
})
closeMobile.addEventListener("click", ()=>{
    headerNav.classList.remove("mobileMode")
    headerNav.style.display = "none"
    closeMobile.classList.remove("show")
    body.style.overflow = "visible"
    alert("work")
})