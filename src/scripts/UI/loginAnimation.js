
const main = document.querySelector('.main__block');
let isLogin;

// Функція для створення елементів
const createElement = (type, text, className, append = main) => {
    const el = document.createElement(type);
    if (text) el.innerHTML = text;
    if (className) el.className = className;
    append.append(el);
    return el;
};

// Функція для введення тексту
function typeText(selector, text, speed) {
    return new Promise((resolve) => {
        const element = document.querySelector(selector);
        let index = 0;

        function type() {
            if (index < text.length) {
                element.innerHTML += text.charAt(index);
                index++;
                setTimeout(type, speed);
            } else {
                resolve();
            }
        }

        type();
    });
}

// Функція для введення даних з кнопкою підтвердження
const getInputWithButton = (message, userData, userDataKey, validator = null) => {
    return new Promise((resolve) => {
        createElement("p", "", "text-active");
        typeText(".text-active", message, 50);
        const input = createElement("input", "", "input");
        const messageElement = createElement("p", "", "message");
        const button = createElement("button", "Next", "next-button");

        const handleInput = () => {
            const value = input.value;
            if (validator) {
                const validationMessage = validator(value);
                if (validationMessage) {
                    messageElement.textContent = validationMessage;
                    return;
                }
            }
            userData[userDataKey] = value;
            resolve();
        };

        input.addEventListener("keydown", (e) => {
            if (e.code === "Enter") {
                handleInput();
            }
        });

        button.addEventListener("click", handleInput);
    });
};

const createEmailAndPassword = (userData) => {
    return new Promise((resolve) => {
        const askEmail = createElement("p", "Enter email: ", "");
        const inputEmail = createElement("input", "", "input");
        inputEmail.type = "email"
        const askPass = createElement("p", "Enter password: ", "");
        const inputPass = createElement("input", "", "input");
        inputPass.type = "password"
        const messageElement = createElement("p", "", "message");
        const button = createElement("button", "Next", "next-button");

        const handleInput = () => {
            const valueEmail = inputEmail.value;
            const valuePass = inputPass.value;
           
            userData["email"] = valueEmail;
            userData["password"] = valuePass;
            resolve();
        };

        inputEmail.addEventListener("keydown", (e) => {
            if (e.code === "Enter") {
                handleInput();
            }
        });
        inputPass.addEventListener("keydown", (e) => {
            if (e.code === "Enter") {
                handleInput();
            }
        });

        button.addEventListener("click", handleInput);
    });
};

// Функція вибору кнопки
const chooseButton = () => {
    return new Promise((resolve) => {
        createElement("p", "", "text-active");
        typeText(".text-active", "Choose:", 50);
        const box = createElement("div", "", "box-buttons");
        const buttonLogin = createElement("button", "Login", "login-button", box);
        const buttonRegistration = createElement("button", "Registration", "registration-button", box);

        buttonLogin.addEventListener("click", () => {
            isLogin = true;
            resolve();
        });

        buttonRegistration.addEventListener("click", () => {
            isLogin = false;
            resolve();
        });
    });
};

// Клас Login
class Login {
    constructor() {
        this.userData = {
            name: '',
            username: '',
            email: '',
            password: ''
        };
    }

    async showHello() {
        const el = createElement("p", "", "text-active");
        el.style.fontSize = "25px";
        await typeText(".text-active", "Welcome to Social Media Moments! Let’s begin the adventure    ", 50);
    }

    askName() {
        return getInputWithButton("What is your name? ", this.userData, "name", value => value ? "" : "Name is required.");
    }

    askNickName() {
        return getInputWithButton("Choose your username: ", this.userData, "username", value => value ? "" : "Username is required.");
    }

    askEmailAndPassword() {
        return new Promise(async (resolve) => {
            await createEmailAndPassword(this.userData)
            resolve();
        });
    }


    removeAll() {
        main.innerHTML = "";
    }
}

// Основна функція для запуску логіну
const startLogin = async () => {
    let s = new Login();
    await s.showHello();
    s.removeAll();
    await chooseButton();
    s.removeAll();

    if (!isLogin) {
        await s.askName();
        s.removeAll();
        await s.askNickName();
        s.removeAll();
        await s.askEmailAndPassword();
        s.removeAll();
        sendRegistration(s.userData);
    } else {
        await s.askEmailAndPassword();
        s.removeAll();
        sendLogin(s.userData)
            
    }
};



startLogin();


const sendRegistration = (data) =>{
        
    fetch("/register", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
            "Content-Type": "application/json"
        },
    })
    .then(res => res.json())
    .then(data => {
        localStorage.setItem('isLogin', "true");
        localStorage.setItem('user', JSON.stringify(data));
        location.href = "/home";
    })
}




const sendLogin = (data) =>{

fetch("/login", {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
        "Content-Type": "application/json"
    },
})
.then(response => {
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return response.json();
})
.then(data => {
    localStorage.setItem('isLogin', "true");
    localStorage.setItem('user', JSON.stringify(data));
    location.href = "/home";

})
.catch(error => {
    alert("No email password")
    location.href = "/";

});
}    






