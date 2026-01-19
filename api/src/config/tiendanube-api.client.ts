import axios from "axios";
import { userRepository } from "@repository";
import { HttpErrorException } from "@utils";

export const tiendanubeApiClient = axios.create({
  baseURL: process.env.TIENDANUBE_API_URL,
  headers: {
    "Content-Type": "application/json",
    "User-Agent": `${process.env.CLIENT_ID} (${process.env.CLIENT_EMAIL})`,
  },
});

tiendanubeApiClient.interceptors.request.use(
  (config) => {
    // Do something before request is sent
    const urlParts = config.url?.split("/") || [];
    // Handle leading slash (e.g. /123/v1/scripts -> ['', '123', ...]) or no leading slash (123/v1/scripts -> ['123', ...])
    const storeIdStr = urlParts[0] || urlParts[1];
    const storeId = parseInt(storeIdStr || '0', 10);

    const { access_token } = userRepository.findOne(storeId);
    config.headers["Authentication"] = `bearer ${access_token}`;

    // Mock for local development
    if (access_token === 'test_access_token') {
        const url = config.url || '';
        
        // Mock Response Adapter
        config.adapter = async (cfg) => {
            return new Promise((resolve, reject) => {
                const response = {
                    data: [],
                    status: 200,
                    statusText: 'OK',
                    headers: {},
                    config: cfg,
                    request: {}
                };

                if (cfg.method?.toLowerCase() === 'get' && url.includes('/scripts')) {
                    // Return empty scripts list or mock existing script
                    process.nextTick(() => resolve({ ...response, data: [] }));
                } else if ((cfg.method?.toLowerCase() === 'post' || cfg.method?.toLowerCase() === 'put') && url.includes('/scripts')) {
                    // Mock script creation/update
                     process.nextTick(() => resolve({ ...response, data: { id: 123, ...JSON.parse(cfg.data) } }));
                } else {
                     // Pass through other requests or 404
                     // Ideally we shouldn't make other requests with test token
                     process.nextTick(() => reject({ response: { status: 404, data: { message: 'Mock not found' } } }));
                }
            });
        };
    }

    return config;
  },
  function (error) {
    // Do something with request error

    if (error.isAxiosError) {
      const { data } = error.response;
      const payload = new HttpErrorException(
        "TiendanubeApiClient - " + data?.message,
        data?.description
      );
      payload.setStatusCode(data?.code);
      return Promise.reject(payload);
    }

    return Promise.reject(error);
  }
);

tiendanubeApiClient.interceptors.response.use(
  (response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    return response.data || {};
  },
  function (error) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    if (error.isAxiosError) {
      const { data } = error.response;
      const payload = new HttpErrorException(
        "tiendanubeApiClient - " + data?.message,
        data?.description
      );
      payload.setStatusCode(data?.code);
      return Promise.reject(payload);
    }

    return Promise.reject(error);
  }
);
