const ytsr = require('ytsr');
const request = require('request');
const fs = require('fs');
const path = require('path');

// API options to get the download link
const apiOptions = {
  method: 'GET',
  url: 'https://youtube-mp36.p.rapidapi.com/dl',
  headers: {
    'x-rapidapi-key': '31211cf373msh6e2d73538db77e4p1c1d77jsn54cd65f375d6',
    'x-rapidapi-host': 'youtube-mp36.p.rapidapi.com'
  }
};

// Function to search for a video and get its ID
async function searchVideo(query) {
  try {
    const searchResults = await ytsr(query, { limit: 1 });
    const video = searchResults.items.find(item => item.type === 'video');
    if (!video) {
      console.error('No video found for the query:', query);
      return null;
    }
    console.log('Found video:', video);
    return { id: video.id, title: video.title };
  } catch (error) {
    console.error('Error during video search:', error);
    return null;
  }
}

// Function to download the file
function downloadFile(fileUrl, outputLocationPath) {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createWriteStream(outputLocationPath);
    request(fileUrl)
      .pipe(fileStream)
      .on('finish', () => {
        resolve();
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

// Function to get the download link and download the file
function getDownloadLinkAndDownloadFile(videoId, videoName) {
  return new Promise((resolve, reject) => {
    apiOptions.qs = { id: videoId };
    request(apiOptions, function (error, response, body) {
      if (error) return reject(error);

      const jsonResponse = JSON.parse(body);
      if (jsonResponse.status !== 'ok') {
        return reject(new Error('Error in API response: ' + jsonResponse.msg));
      }

      const downloadUrl = jsonResponse.link;
      const fileName = videoName + ".mp3"; // Adjust the file name as needed
      const outputPath = path.join(__dirname, "../", "downloads", fileName);

      // Download the file
      downloadFile(downloadUrl, outputPath)
        .then(() => {
          console.log('File downloaded successfully');
          resolve(fileName);
        })
        .catch((downloadError) => {
          console.error('Error downloading file:', downloadError);
          reject(downloadError);
        });
    });
  });
}

// Main function to search for a video and download it
async function main(query) {
  try {
    const video = await searchVideo(query);
    if (!video) {
      throw new Error('Video not found');
    }
    const outputPath = await getDownloadLinkAndDownloadFile(video.id, video.title);
    return outputPath;
  } catch (error) {
    console.error('Error in main function:', error);
    throw error;
  }
}

module.exports = { main };
