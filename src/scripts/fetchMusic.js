
const musicContainer = document.querySelector('.music__container');
const selectedTracks = new Set();

async function getRandomTrack() {
  const clientId = 'b28005e70d3b41d996ebb5ba90739e02';
  const clientSecret = '33b31eee71e8496cbc9318146529aed9';
  const tokenEndpoint = 'https://accounts.spotify.com/api/token';
  const apiEndpoint = 'https://api.spotify.com/v1/playlists/37i9dQZF1DX7gIoKXt0gmx/tracks'; // Example playlist

  // Step 1: Get access token
  const accessToken = await getAccessToken(clientId, clientSecret, tokenEndpoint);

  // Step 2: Use access token to fetch tracks
  const response = await fetch(apiEndpoint, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch tracks');
  }

  const data = await response.json();
  console.log(data.items)
  const tracks = data.items.map(item => ({
    id: item.track.id,
    title: item.track.name,
    artist: item.track.artists[0].name,
    imageUrl: item.track.album.images[0].url,
    previewUrl: item.track.preview_url,
    fullTrackUrl: item.track.external_urls.spotify
  }));

  let randomTrack = null;
  do {
    const randomIndex = Math.floor(Math.random() * tracks.length);
    randomTrack = tracks[randomIndex];
  } while (selectedTracks.has(randomTrack.id));

  selectedTracks.add(randomTrack.id);

  return randomTrack;
}

async function getAccessToken(clientId, clientSecret, tokenEndpoint) {
  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret)
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    throw new Error('Failed to obtain access token');
  }

  const data = await response.json();
  return data.access_token;
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
const getAUDIO = async (name) => {
  try {
    const response = await fetch(`/api/audio/${name}`); // Adjust path if necessary
    if (!response.ok) {
      throw new Error('Network response was not ok ' + response.statusText);
    }
    const track = await response.text();
    console.log('Response:', response, 'Track:', track);
    return track;
  } catch (error) {
    console.error('There was a problem with the fetch operation:', error);
  }
};


// Example usage


async function createTrack(randomTrack) {
  console.log(randomTrack);
  const path = await getAUDIO(randomTrack.title); // Await the completion of getAUDIO
  console.log(path);

  const musicPrew = `
    <div class="music__songPrew">  
      <img src="${randomTrack.imageUrl}" alt="${randomTrack.title}" class="music__songPrew-img">
      <p class="music__songPrew-title">${randomTrack.title}</p>
      <p class="music__songPrew-artist">${randomTrack.artist}</p>
      <audio controls src="${path}"></audio>  <!-- Use the path here -->
      <a href="${randomTrack.fullTrackUrl}" target="_blank" class="music__songPrew-link">Listen on Spotify</a>
    </div>
  `;
  musicContainer.innerHTML += musicPrew; // Assuming musicContainer is defined elsewhere
}

// Load 15 random tracks
loadRandomTracks(1);
