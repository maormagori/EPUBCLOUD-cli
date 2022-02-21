const { program } = require("commander");

program
    .requiredOption(
        "-e, --email <email>",
        "epubcloud account email is necessary."
    )
    .requiredOption(
        "-p, --password <password>",
        "epubcloud account password is necessary."
    )
    .requiredOption("-d, --directory <dir>", "EPUB files download directory.")
    .requiredOption("-ak, --apikey <apikey>", "Your hbreader apikey.")
    .option("-a, --all", "Download all of user's available books.", false);

module.exports = program;
