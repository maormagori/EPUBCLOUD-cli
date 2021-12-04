require("dotenv").config();
const cloudapi = require("../API/communicator");
const fs = require("fs");
const { dirname } = require("path");
const path = require("path");

let communicator;

beforeAll(() => {
    communicator = new cloudapi(
        process.env.TESTING_EMAIL,
        process.env.TESTING_PASSWORD
    );
});

describe("Testing api calls", () => {
    test("connect to epubcloud with right credetials", async () => {
        expect(await communicator.connect()).toEqual(true);
    });
    test("connect to epubcloud with wrong credetials", async () => {
        const newComm = new cloudapi("mockemail", "mockpass");
        expect(newComm.connect).toThrow(Error);
    });
    test("refresh connection", async () => {
        expect(await communicator.reconnect()).toEqual(true);
    });
    test("get list of books", async () => {});
    test("download a book", async () => {});
});
