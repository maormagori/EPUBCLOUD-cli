const { program } = require("commander");

program
    .requiredOption(
        "-e, --email <email>]",
        "epubcloud account email is necessary."
    )
    .requiredOption(
        "-p, --password <password>",
        "epubcloud account password is necessary."
    )
    .option("-d, --directory <dir>", "EPUB files download directory.")
    .option("-a, --all", "Download all of user's available books.", false)

    //Uninitialized but in planning.
    .option("-k, --kindle", "Kindle address to send the books to.")
    .option("-c, --convert", "Choose books files' extension.");

program.parse();
