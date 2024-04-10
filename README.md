
# Uninterrupted Access to Dropbox API

This guide will help you set up uninterrupted access to the Dropbox API using OAuth 2.0 and refresh tokens.

Dropbox documentation: https://www.dropbox.com/developers/documentation/http/documentation

## Steps

1. Authorize Your App

-   Visit the following URL to authorize your app and generate an authorization code:
```bash
https://www.dropbox.com/oauth2/authorize?client_id=YOUR_APP_KEY&response_type=code&token_access_type=offline
```

2. Use the Authorization Code
-   Once you've authorized your app, you'll receive an authorization code. Use this code in your app codebase, replacing ACCESS_CODE_FROM_STEP_1.

3. Start the Application
-   Run your application (e.g., app.js). For the first time, the application will generate a refresh token.

4. Store the Refresh Token
-   The refresh token generated in Step 3 won't expire. Make sure to store this long-term token securely. In this example, we're storing it as REFRESH_TOKEN.

5. Restart the Application
-   Restart your application. You can now use the upload functionality without any interruption.
    
## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

`YOUR_APP_KEY`

`YOUR_APP_SECRET`

`ACCESS_CODE_FROM_STEP_1`

`REFRESH_TOKEN`

## Support

For support, email Jarvisfranklinthaker@gmail.com

