export async function getAUDIO(name) {
  const response = await fetch(`/api/audio/${name}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch audio for ${name}: ${response.statusText}`);
  }
  return response.text();
}

export function setAudio(trackURL) {
  const track = document.querySelector('#track');
  track.src = trackURL;
  console.log("We set audio " + track + " from " + trackURL);
}
