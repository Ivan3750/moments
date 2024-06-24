export const sendRegistration = (data) =>{
        
        fetch("http://localhost:5000/register", {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json"
            },
        })
        .then(data => {
            console.log('Success:', data);
            localStorage.setItem('isLogin', "true");
            location.href = "../pages/main.html";
        })
        console.log(JSON.stringify(data))
}


   
    
export const sendLogin = (data) =>{

    fetch("http://localhost:5000/login", {
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
        console.log('Success:', data);
        localStorage.setItem('isLogin', "true");
        localStorage.setItem('user', JSON.stringify(data));
        alert(JSON.stringify(data))
        location.href = "../pages/main.html";
    })
    .catch(error => {
        alert("No email password")
        console.error('Error:', error);
    });
}    






