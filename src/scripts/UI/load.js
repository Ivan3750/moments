let mask = document.querySelector('.mask');

window.addEventListener('load', () => {
    setTimeout(() => {
    mask.classList.add('hide');
    mask.remove();
  }, 500);
})

const checkJWT = async () => {
  const token = JSON.parse(localStorage.getItem('token')); // Assuming you store the token in localStorage
  
  try {
    if (!token) {
      throw new Error('No token found'); // Handle case where token is not present
    }

    const response = await fetch('/API/checkJWT', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // Send token in the Authorization header
      }
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
  
  } catch (error) {
    location.href = "/auth"
    console.error('Error checking token:', error.message);
    // Handle network errors or other issues
  }
}


checkJWT();
