const musicContainer = document.querySelector('.music__container');
const selectedTracks = new Set();

async function getRandomTrack() {
  const limit = 100; // Fetch 100 tracks to have a good pool to choose from
  const response = await fetch(`https://api.deezer.com/chart/0/tracks?limit=${limit}`);
  const data = await response.json();

  if (data && data.data && data.data.length > 0) {
    let randomTrack = null;
    do {
      const randomIndex = Math.floor(Math.random() * data.data.length);
      randomTrack = data.data[randomIndex];
    } while (selectedTracks.has(randomTrack.id)); // Check if track already selected

    selectedTracks.add(randomTrack.id); // Add track to selected set

    return randomTrack;
  } else {
    throw new Error('No tracks found.');
  }
}

async function loadRandomTracks(count) {
  try {
    for (let i = 0; i < count; i++) {
      const randomTrack = await getRandomTrack();
      createTrack(randomTrack);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

function createTrack(randomTrack) {
  const musicPrew = `
    <div class="music__songPrew" ">  
      <img src="https://e-cdns-images.dzcdn.net/images/cover/${randomTrack.md5_image}/320x320.jpg" alt="" class="music__songPrew-img">
      <p class="music__songPrew-title">${randomTrack.title_short}</p>
      <p class="music__songPrew-artist">${randomTrack.artist.name}</p>
    </div>
  `;/* onclick="${loadTrack(randomTrack)} */
  musicContainer.innerHTML += musicPrew;
}

// Завантажуємо 20 треків
loadRandomTracks(15);
