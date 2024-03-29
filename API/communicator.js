const axios = require("axios");
const randomstring = require("randomstring");
const fs = require("fs");
const path = require("path");
const https = require("https");
//Still not sure if apikey is private to the user or the client so ATM it's private.

const EPUBCLOUD_API = "https://epubcloud.heliconbooks.com/epubcloudapi.php";
const ANDROID_API_KEY = "bc0fdae145d3a6599ee3800cf032a6d1"; //https://github.com/maormagori/EPUBCLOUD-cli/issues/10

class EpubCloudCommunicator {
  constructor(email, password, apikey) {
    this.email = email || "";
    this.password = password || "";
    this.apikey = ANDROID_API_KEY;

    if (fs.existsSync(path.join(__dirname, "gcmregid")))
      this.gcmregid = fs.readFileSync(path.join(__dirname, "gcmregid"), {
        encoding: "utf-8",
      });
    else {
      const mockGcmregid = randomstring.generate(152);
      this.gcmregid = mockGcmregid;
      fs.writeFileSync(path.join(__dirname, "gcmregid"), mockGcmregid);
    }
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
        gcmregid: this.gcmregid,
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
        gcmregid: this.gcmregid,
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

  async getBook(bookid, filePath) {
    const res = await axios.get(EPUBCLOUD_API + "/", {
      params: {
        action: "getbook",
        appname: "hbreader",
        apikey: this.apikey,
        email: this.email,
        token: this.token,
        bookid: bookid,
      },
      forcedJSONParsing: false,
      responseType: "stream",
    });

    let ws = fs.createWriteStream(filePath);
    res.data.pipe(ws);

    await new Promise((resolve, reject) => {
      res.data.on("end", () => {
        resolve();
      });
    });
  }
}

module.exports = EpubCloudCommunicator;
