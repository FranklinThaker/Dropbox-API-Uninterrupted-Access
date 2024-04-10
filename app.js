require('dotenv').config();

const btoa = require('btoa');
const { Dropbox } = require('dropbox');
const express = require('express');
const logger = require('morgan');
const multer = require('multer');
const fetch = require('node-fetch');
const fs = require('fs');
const querystring = require('querystring');

const app = express();

const { YOUR_APP_KEY } = process.env;
const { YOUR_APP_SECRET } = process.env;
const { ACCESS_CODE_FROM_STEP_1 } = process.env;
let { REFRESH_TOKEN } = process.env; // store this token from the first time & then use this token from the DB
let ACCESS_TOKEN = '';
let dbx;

const upload = multer({ dest: 'uploads/' });

// Middleware to parse request body
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '50mb' }));
app.use(logger('common', { skip: () => process.env.NODE_ENV === 'test' }));

async function getRefreshToken() {
  try {
    const base64authorization = btoa(`${YOUR_APP_KEY}:${YOUR_APP_SECRET}`);
    const response = await fetch('https://api.dropbox.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${base64authorization}`,
      },
      body: querystring.stringify({
        code: ACCESS_CODE_FROM_STEP_1,
        grant_type: 'authorization_code',
      }),
    });

    const data = await response.json();
    console.log('Refresh Token Response:', data);
    if (!data.error) {
      REFRESH_TOKEN = data.refresh_token;
      console.log('🚀 ~ getRefreshToken ~ REFRESH_TOKEN:', REFRESH_TOKEN);
    }
  } catch (error) {
    console.error('Error getting refresh token:', error);
  }
}

async function refreshAccessToken() {
  try {
    const base64authorization = btoa(`${YOUR_APP_KEY}:${YOUR_APP_SECRET}`);
    const response = await fetch('https://api.dropbox.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${base64authorization}`,
      },
      body: querystring.stringify({
        refresh_token: REFRESH_TOKEN,
        grant_type: 'refresh_token',
      }),
    });

    const data = await response.json();
    console.log('Access Token Response:', data);
    ACCESS_TOKEN = data.access_token;
    console.log('🚀 ~ refreshAccessToken ~ ACCESS_TOKEN:', ACCESS_TOKEN);
  } catch (error) {
    console.error('Error refreshing access token:', error);
  }
}

// POST endpoint to upload a file to Dropbox
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    // Call the functions to get refresh token and refresh access token
    await refreshAccessToken();

    dbx = new Dropbox({ accessToken: ACCESS_TOKEN });

    // Get the file from the request body
    const { file } = req;

    if (!file) {
      return res.status(400).send('No file uploaded');
    }

    const filePath = file.path;

    // Upload the file to Dropbox
    const response = await dbx.filesUpload({
      path: `/${file.originalname}`,
      contents: fs.createReadStream(filePath),
    });
    console.log('🚀 ~ app.post ~ response:', response);

    // Delete the temporary file
    await fs.promises.unlink(filePath);

    return res
      .status(200)
      .json({ message: 'File uploaded successfully', response });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error uploading file' });
  }
});

try {
  getRefreshToken();
} catch (error) {
  console.log('🚀 ~ getRefreshToken:', error);
}

// Start the server
const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
