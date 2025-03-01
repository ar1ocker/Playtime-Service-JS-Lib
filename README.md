#Playtime Service JS Lib

Небольшая библиотека которая позволяет делать запросы к Playtime-Service, преимущественно предназначена для SquadJS

```js
import { default as PlaytimeServiceAPI, TIME_IS_UNKNOWN } from "./playtime-service-api.js";

let playtimeAPI = new PlaytimeServiceAPI(
  "playtime_service_api_url",
  "playtime_service_api_secret_key",
  SQUAD_GAME_ID
);

let playtime;
try {
  playtime = await this.playtimeAPI.requestPlaytimeBySteamID("7600000000000000");
  console.log(`{playtime.steamID} steam ${playtime.steamPlaytime}, bm ${playtime.bmPlaytime}`)
} catch (error) {
  this.verbose(1, this.locale`Failed to get playtime for ${steamID} with error: ${error}`);
}
```
