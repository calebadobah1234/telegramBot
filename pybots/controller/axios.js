import axios from "axios";
const MY_TOKEN = "7425329885:AAGVmiL-2m3EgY62a4RFaYluWOvM6kkebfg";

const BASE_URL = `https://api.telegram.org/bot7425329885:AAGVmiL-2m3EgY62a4RFaYluWOvM6kkebfg`;

const getAxiosInstance = () => {
  return {
    get(method, params) {
      return axios.get(`/${method}`, {
        baseURL: BASE_URL,
        params,
      });
    },
    post(method, data) {
      return axios({
        method: "post",
        baseURL: BASE_URL,
        url: `${method}`,
        data,
      });
    },
  };
};

export { getAxiosInstance };
