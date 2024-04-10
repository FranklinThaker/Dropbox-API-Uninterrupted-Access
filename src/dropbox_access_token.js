/**
 * this file is a CommonJS version of "dropbox-refresh-token" module
 * https://github.com/boly38/dropbox-refresh-token (ES Module)
 */
require('dotenv').config();
const {isSet, getShortLivedAccessCodeUrlViaLoginUrl, getRefreshToken, refreshAccessToken} = require("./dropboxRefreshToken.cjs");

const pleaseSetupEnvWithAppVariables = () => {
    console.log(
        "Go to your dropbox app : https://www.dropbox.com/developers/apps/\n\n" +
        "then set as environment following variables : DROPBOX_APP_KEY, DROPBOX_APP_SECRET\n\n" +
        "Exemple:\n" +
        "\texport DROPBOX_APP_KEY=xxxyyyzzz\n" +
        "\texport DROPBOX_APP_SECRET=xxxyyyzzz"
    );
}
const retrieveShortLiveAccessCode = appKey => {
    const urlLoginToUse = getShortLivedAccessCodeUrlViaLoginUrl(appKey);
    console.log(`In order to get a short-lived access code, go to ${urlLoginToUse}`);
    console.log(" - login and keep this code:\n");
    console.log("\texport DROPBOX_SHORT_LIVED_ACCESS_CODE=just_received_code\n");
    console.log(" - this code is used to request a long-lived refresh token\n");
}

const getLongLivedRefreshTokenFromShortLivedAccessToken = async (shortLivedAccessCode, appKey, appSecret) => {
    console.log(" * get long lived refresh token from short lived access code");
    return await getRefreshToken(shortLivedAccessCode, appKey, appSecret)
        .catch(err => {
            if (err.message.includes("invalid_grant")) {
                console.log("please unset DROPBOX_SHORT_LIVED_ACCESS_CODE (or set DROPBOX_REFRESH_TOKEN you got in the past) and retry");
            }
        });
}

const getFreshSLAccessTokenFromRefreshToken = async (refreshToken, appKey, appSecret) => {
    if (!isSet(refreshToken)) {
        console.log("please unset DROPBOX_SHORT_LIVED_ACCESS_CODE to retry");
        return;
    }
    console.log(" - now we have DROPBOX_REFRESH_TOKEN (long lived), we could (offline) request a short-lived access token each time we need");
    await refreshAccessToken(refreshToken, appKey, appSecret)
        .catch(error => {
            const {message} = error;
            console.log("getFreshSLAccessTokenFromRefreshToken error;", error.message)
            if (message.includes("refresh token is invalid or revoked")) {
                console.log("please unset DROPBOX_REFRESH_TOKEN to retry");
            }
        });
}

const dropbox_get_offline_long_term_access_token = async () => {
    try {

        const {
            DROPBOX_APP_KEY,
            DROPBOX_APP_SECRET,
            DROPBOX_SHORT_LIVED_ACCESS_CODE,
        } = process.env;
        let {DROPBOX_REFRESH_TOKEN} = process.env;
        let refreshTokenWasSet = isSet(DROPBOX_REFRESH_TOKEN);
        if (!isSet(DROPBOX_APP_KEY) || !isSet(DROPBOX_APP_SECRET)) {
            pleaseSetupEnvWithAppVariables();
            return;
        }
        if (!isSet(DROPBOX_SHORT_LIVED_ACCESS_CODE) && !isSet(DROPBOX_REFRESH_TOKEN)) {
            retrieveShortLiveAccessCode(DROPBOX_APP_KEY);
            return;
        }
        if (!refreshTokenWasSet) {
            DROPBOX_REFRESH_TOKEN = await getLongLivedRefreshTokenFromShortLivedAccessToken(DROPBOX_SHORT_LIVED_ACCESS_CODE, DROPBOX_APP_KEY, DROPBOX_APP_SECRET);
        }
        if (isSet(DROPBOX_REFRESH_TOKEN)) {
            await getFreshSLAccessTokenFromRefreshToken(DROPBOX_REFRESH_TOKEN, DROPBOX_APP_KEY, DROPBOX_APP_SECRET);
            if (!refreshTokenWasSet) {
                console.log(
                    " - keep this REFRESH_TOKEN -- This to avoid re-ask refresh token with same shortLivedAccessCode that gives error 'code has already been used'\n" +
                    "\texport DROPBOX_REFRESH_TOKEN=value\n"
                );
            }
        }
    } catch (e) {
        console.error(e);
    }
}

dropbox_get_offline_long_term_access_token().then((r) => {
});