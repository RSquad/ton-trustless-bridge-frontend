import { TonClient } from "ton";
import { Api, HttpClient } from "tonapi-sdk-js";

const httpClient = new HttpClient({
  baseUrl: process.env.NEXT_PUBLIC_TONAPI_BASE_PATH,
  // baseApiParams: {
  //   headers: {
  //     Authorization: `Bearer ${process.env.NEXT_PUBLIC_TONAPI_KEY}`,
  //     "Content-type": "application/json",
  //   },
  // },
});

const tonRawBlockchainApi = new Api(httpClient);

const tonClient = new TonClient({
  endpoint: process.env.NEXT_PUBLIC_TON_CLIENT_ENDPOINT!,
  apiKey: process.env.NEXT_PUBLIC_TON_CLIENT_API_KEY!,
});

export { tonClient, tonRawBlockchainApi };
