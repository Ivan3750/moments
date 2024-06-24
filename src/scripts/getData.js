export const getUser = async () => {
    const email = JSON.parse(localStorage.getItem('user')).email;
    try {
        const response = await fetch(`http://localhost:5000/user/${email}`);
        const user = await response.json();
        console.log(user);
        return user;
    } catch (error) {
        console.error('Error fetching user:', error);
        return null;
    }
};

const user = await getUser();
console.log(user);
