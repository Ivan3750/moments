const settingsNickname = document.querySelector(".settings-nickname")
const settingsEmail = document.querySelector(".settings-email")
const settingsPassword = document.querySelector(".settings-password")
const btnPassword = document.querySelector(".change-password")
const btnDelete = document.querySelector(".btn-delete")
const btnSave = document.querySelector(".save-change")

const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
}

const validatePassword = (password) => {
    // Add your own password validation logic if needed
    if(password !== ""){
        return password.length >= 6
    }else{
        return true
    }
}

const getSettings = async () => {
    try {
        const response = await fetch(`/API/user/${JSON.parse(localStorage.token).replace(/%22/g, "")}`)
        const settingsData = await response.json()
        
        if (response.ok) {
            settingsNickname.value = settingsData.username
            settingsEmail.value = settingsData.email
            settingsPassword.value = ""  // Do not prefill password for security reasons
        } else {
            console.error("Failed to fetch settings:", settingsData.message)
        }
    } catch (error) {
        console.error("Error fetching settings:", error)
    }
}

getSettings()
console.log(settingsPassword.disabled)
btnPassword.addEventListener("click", () => {
    settingsPassword.classList.toggle("active")
    settingsPassword.disabled = !settingsPassword.disabled
})

btnSave.addEventListener("click", () => {
    if (validateEmail(settingsEmail.value) && validatePassword(settingsPassword.value)) {
        sendData()
    } else {
        console.error("Invalid email or password")
    }
})

const sendData = async () => {
    try {
        const response = await fetch("API/update", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${JSON.parse(localStorage.token).replace(/%22/g, "")}`
            },
            body: JSON.stringify({ 
                username: settingsNickname.value, 
                email: settingsEmail.value, 
                password: settingsPassword.value 
            })
        })
        
        const result = await response.json()
        if (response.ok) {
            console.log("User updated successfully:", result)
        } else {
            console.error("Error updating user:", result.message)
        }
    } catch (error) {
        console.error("Error updating user:", error)
    }
}

btnDelete.addEventListener("click", async () => {
    try {
        await fetch(`/API/delete/${JSON.parse(localStorage.token).replace(/%22/g, "")}`)
        localStorage.removeItem("token")
        sessionStorage.removeItem("avatar")
        location.href = "/auth"
    } catch (error) {
        console.error("Error deleting user:", error)
    }
})
