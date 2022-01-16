const axios = require("axios");
const randomstring = require("randomstring");
//Still not sure if apikey is private to the user or the client so ATM it's private.
require("dotenv").config();

const EPUBCLOUD_API = "https://epubcloud.heliconbooks.com/epubcloudapi.php";

class EpubCloudCommunicator {
    constructor(email, password, apikey) {
        this.email = email || "";
        this.password = password || "";
        this.apikey = apikey || process.env.APIKEY;
    }

    async request(body) {
        let res;
        try {
            res = await axios.post(EPUBCLOUD_API, body);

            if (res.data.Error != 0) {
                throw new Error(
                    `Error code received from API: ${res.data.Error} \n Error message: ${res.data.Errstr}`
                );
            }

            return res;
        } catch (error) {
            console.error("Error occured while making request", error);
            throw error;
        }
    }

    //Suspecting that multiple gcmregid are registered as multiple devices so just in case:
    //TODO: generate gcmregid one and save locally.
    async connect() {
        this.rengine = (
            await this.request({
                action: "engineversion",
                appname: "hbreader",
                apikey: this.apikey,
            })
        ).data.version;

        this.token = (
            await this.request({
                action: "login",
                appname: "hbreader",
                appversion: "7.02",
                osversion: "Android 11",
                apikey: this.apikey,
                email: this.email,
                password: this.password,
                gcmregid: randomstring.generate(152),
            })
        ).data.Token;

        return true;
    }

    async reconnect() {
        this.token = (
            await this.request({
                action: "conrefresh",
                appname: "hbreader",
                appversion: "7.02",
                osversion: "Android 11",
                apikey: this.apikey,
                email: this.email,
                token: this.token,
                lang: "en",
                gcmregid: randomstring.generate(152),
                rengine: this.rengine,
            })
        ).data.Token;

        return true;
    }

    async getAllBooks() {
        let booklistReq = await this.request({
            action: "booklist",
            appname: "hbreader",
            apikey: this.apikey,
            email: this.email,
            token: this.token,
            offset: 0,
            limit: 300,
        });

        return { count: booklistReq.data.count, books: booklistReq.data.books };
    }

    async getBookData(bookid) {
        let bookData = (
            await this.request({
                action: "bookdata",
                appname: "hbreader",
                apikey: this.apikey,
                email: this.email,
                token: this.token,
                bookid: bookid,
            })
        ).data.bookdata[0];

        return bookData;
    }

    //DOES'NT WORK YET
    async getBook(bookid) {
        return (
            await axios.get(EPUBCLOUD_API + "/", {
                params: {
                    actions: "getbook",
                    appname: "hbreader",
                    apikey: this.apikey,
                    email: this.email,
                    token: this.token,
                    bookid: bookid,
                },
                forcedJSONParsing: false,
            })
        ).data;
    }
}

module.exports = EpubCloudCommunicator;
