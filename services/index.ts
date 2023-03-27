import { TonClient } from "ton";
import { Configuration, RawBlockchainApi } from "tonapi-sdk-js";

const tonRawBlockchainApi = new RawBlockchainApi(
  new Configuration({
    basePath: process.env.NEXT_PUBLIC_TONAPI_BASE_PATH,
    headers: {
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_TONAPI_KEY}`,
    },
  })
);

const tonClient = new TonClient({
  endpoint: process.env.NEXT_PUBLIC_TON_CLIENT_ENDPOINT!,
  apiKey: process.env.NEXT_PUBLIC_TON_CLIENT_API_KEY!,
});

export { tonRawBlockchainApi, tonClient };
