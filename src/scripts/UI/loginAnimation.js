const main = document.querySelector('.main__block');
let isLogin;

const createElement = (type, text, className, append = main) => {
    const el = document.createElement(type);
    if (text) el.innerHTML = text;
    if (className) el.className = className;
    append.append(el);
    return el;
};

const typeText = (selector, text, speed) => {
    return new Promise((resolve) => {
        const element = document.querySelector(selector);
        let index = 0;

        const type = () => {
            if (index < text.length) {
                element.innerHTML += text.charAt(index);
                index++;
                setTimeout(type, speed);
            } else {
                resolve();
            }
        };

        type();
    });
};

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
            if (e.code === "Enter") handleInput();
        });

        button.addEventListener("click", handleInput);
    });
};

const createEmailAndPassword = (userData) => {
    return new Promise((resolve) => {
        createElement("p", "Enter email: ", "");
        const inputEmail = createElement("input", "", "input", main);
        inputEmail.type = "email";

        createElement("p", "Enter password: ", "");
        const inputPass = createElement("input", "", "input", main);
        inputPass.type = "password";

        const button = createElement("button", "Next", "next-button");

        const handleInput = () => {
            userData.email = inputEmail.value;
            userData.password = inputPass.value;
            resolve();
        };

        inputEmail.addEventListener("keydown", (e) => {
            if (e.code === "Enter") handleInput();
        });
        inputPass.addEventListener("keydown", (e) => {
            if (e.code === "Enter") handleInput();
        });

        button.addEventListener("click", handleInput);
    });
};

const chooseButton = () => {
    return new Promise((resolve) => {
        createElement("p", "", "text-active");
        typeText(".text-active", "Choose:", 50);
        const box = createElement("div", "", "box-buttons");
        createElement("button", "Login", "login-button", box).addEventListener("click", () => {
            isLogin = true;
            resolve();
        });
        createElement("button", "Registration", "registration-button", box).addEventListener("click", () => {
            isLogin = false;
            resolve();
        });
    });
};

class Login {
    constructor() {
        this.userData = {
            name: '',
            username: '',
            email: '',
            password: ''
        };
    }

    askName() {
        return getInputWithButton("What is your name? ", this.userData, "name", value => value ? "" : "Name is required.");
    }

    askNickName() {
        return getInputWithButton("Choose your username: ", this.userData, "username", value => value ? "" : "Username is required.");
    }

    askEmailAndPassword() {
        return createEmailAndPassword(this.userData);
    }

    removeAll() {
        main.innerHTML = "";
    }
}

const startLogin = async () => {
    const loginInstance = new Login();

    await chooseButton();
    loginInstance.removeAll();

    if (!isLogin) {
        await loginInstance.askName();
        loginInstance.removeAll();
        await loginInstance.askNickName();
        loginInstance.removeAll();
        await loginInstance.askEmailAndPassword();
        loginInstance.removeAll();
        sendRegistration(loginInstance.userData);
    } else {
        await loginInstance.askEmailAndPassword();
        loginInstance.removeAll();
        sendLogin(loginInstance.userData);
    }
};

const sendRegistration = (data) => {
    fetch("API/register", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
            "Content-Type": "application/json"
        },
    })
    .then(res => res.json())
    .then(data => {
        localStorage.setItem('isLogin', "true");
        localStorage.setItem('token', JSON.stringify(data.token));
        location.href = "/home";
    });
};

const sendLogin = (data) => {
    fetch("API/login", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
            "Content-Type": "application/json"
        },
    })
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
    })
    .then(data => {
        localStorage.setItem('isLogin', "true");
        localStorage.setItem('token', JSON.stringify(data.token));
        location.href = "/home";
    })
    .catch(error => {
        alert("No email or password");
        location.href = "/";
    });
};

startLogin();
