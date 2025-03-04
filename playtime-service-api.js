//@ts-check
import axios from "axios";
import { subtle } from "node:crypto";

export const TIME_IS_UNKNOWN = null;

export default class PlaytimeServiceAPI {
  constructor(fullApiUrl, secretKey, gameID) {
    this.fullApiURL = fullApiUrl;
    this.gameID = gameID;
    this._secret_key = secretKey;
    this._importedKey = null;

    this._encoder = new TextEncoder();
  }

  async _importKey() {
    this._importedKey = await subtle.importKey(
      "raw",
      this._encoder.encode(this._secret_key),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
  }

  async _computeSignatureFromData(data) {
    if (this._importedKey === null) {
      await this._importKey();
    }

    //@ts-expect-error _importedKey is defined
    return Buffer.from(await subtle.sign("HMAC", this._importedKey, this._encoder.encode(data))).toString("hex");
  }

  /**
   *
   * @param {Array<number | string>} steamIDs
   * @param {boolean} isNeedUpdate
   * @returns {Promise<Array<ReturnedPlaytime>>}
   */
  async requestPlaytimesBySteamIDs(steamIDs, isNeedUpdate = false) {
    const data = JSON.stringify({
      steam_ids: steamIDs,
      game_id: this.gameID,
      is_need_update: isNeedUpdate,
    });

    let response;

    try {
      response = await axios.post(this.fullApiURL, data, {
        headers: {
          "Content-Type": "application/json",
          "X-SIGNATURE": await this._computeSignatureFromData(data),
        },
      });
    } catch (error) {
      throw new Error(`Failed to fetch playtimes: ${error.message}, ${error.response.data}`);
    }

    return response.data.map((value) => new ReturnedPlaytime(value.steam_id, value.steam_playtime, value.bm_playtime));
  }

  /**
   *
   * @param {number | string} steamID
   * @param {boolean} isNeedUpdate
   * @returns {Promise<ReturnedPlaytime>}
   */
  async requestPlaytimeBySteamID(steamID, isNeedUpdate = false) {
    return (await this.requestPlaytimesBySteamIDs([steamID], isNeedUpdate))[0];
  }

  /**
   * 
   * @param {number | string} steamID 
   * @param {boolean} isNeedUpdate 
   * @returns {Promise<number>}
   */
  async getPlayerMaxSecondsPlaytime(steamID, isNeedUpdate = false) {
    const playtime = await this.requestPlaytimeBySteamID(steamID, isNeedUpdate);

    if (playtime.bmPlaytime || playtime.steamPlaytime) {
      return Math.max(playtime.bmPlaytime, playtime.steamPlaytime);
    }

    return TIME_IS_UNKNOWN;
  }

  /**
   *
   * @param {Array<number | string>} steamIDs
   * @param {boolean} isNeedUpdate
   * @returns {Promise<number>}
   */
  async getPlayersTotalSecondsPlaytime(steamIDs, isNeedUpdate = false) {
    const playtimes = await this.requestPlaytimesBySteamIDs(steamIDs, isNeedUpdate);

    return playtimes.reduce((prev, curr) => prev + Math.max(curr.bmPlaytime, curr.steamPlaytime), 0);
  }
}

class ReturnedPlaytime {
  constructor(steamID, steamPlaytime, bmPlaytime) {
    this.steamID = steamID;
    this.steamPlaytime = steamPlaytime;
    this.bmPlaytime = bmPlaytime;
  }
}
