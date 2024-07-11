import {sendToPlayerTrack} from "../scripts/player.js"


const musicContainer = document.querySelector('.music__container');
const selectedTracks = new Set();

const SPOTIFY_CONFIG = {
  clientId: 'b28005e70d3b41d996ebb5ba90739e02',
  clientSecret: '33b31eee71e8496cbc9318146529aed9',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
  apiEndpoint: 'https://api.spotify.com/v1/playlists/37i9dQZF1DX7gIoKXt0gmx/tracks' // Example playlist
};

async function fetchWithAuth(url, accessToken) {
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }

  return response.json();
}

async function getAccessToken({ clientId, clientSecret, tokenEndpoint }) {
  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`)
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    throw new Error('Failed to obtain access token');
  }

  const data = await response.json();
  return data.access_token;
}

async function getRandomTrack(tracks) {
  let randomTrack = null;
  do {
    const randomIndex = Math.floor(Math.random() * tracks.length);
    randomTrack = tracks[randomIndex];
  } while (selectedTracks.has(randomTrack.id) || !randomTrack.previewUrl);

  selectedTracks.add(randomTrack.id);
  return randomTrack;
}

async function getAUDIO(name) {
  const response = await fetch(`/api/audio/${name}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch audio for ${name}: ${response.statusText}`);
  }

  return response.text();
}

function setAudio(trackURL) {
  const track = document.querySelector('#track');
  track.src = trackURL;
/*   track.play();
 */}

function createTrackHTML(track) {
  return `
    <a href="#" class="music__songPrew-link" data-track='${JSON.stringify(track)}'>
      <div class="music__songPrew">
        <img src="${track.imageUrl}" alt="${track.title}" class="music__songPrew-img">
        <p class="music__songPrew-title">${track.title}</p>
        <p class="music__songPrew-artist">${track.artist}</p>
      </div>
    </a>
  `;
}

async function loadRandomTracks(count) {
  try {
    const accessToken = await getAccessToken(SPOTIFY_CONFIG);
    const data = await fetchWithAuth(SPOTIFY_CONFIG.apiEndpoint, accessToken);

    const tracks = data.items.map(item => ({
      id: item.track.id,
      title: item.track.name,
      artist: item.track.artists[0].name,
      imageUrl: item.track.album.images[0].url,
      previewUrl: item.track.preview_url,
      fullTrackUrl: item.track.external_urls.spotify
    })).filter(track => track.previewUrl); // Filter tracks without preview URLs

    let trackHTML = '';
    for (let i = 0; i < count; i++) {
      const randomTrack = await getRandomTrack(tracks);
      trackHTML += createTrackHTML(randomTrack);
    }

    musicContainer.innerHTML = trackHTML;

    musicContainer.addEventListener('click', async (event) => {
      const link = event.target.closest('.music__songPrew-link');
      if (link) {
        event.preventDefault();
        const track = JSON.parse(link.getAttribute('data-track'));
        console.log(track)
        sendToPlayerTrack(track)
        try {
          const audioPath = await getAUDIO(track.title);
          setAudio(audioPath);
        } catch (error) {
          console.error('Error fetching audio:', error);
        }
      }
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

// Load 15 random tracks
loadRandomTracks(15);
