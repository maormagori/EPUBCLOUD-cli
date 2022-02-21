const listr = require("listr");
const Observable = require("zen-observable");
const { MultiSelect } = require("enquirer");
const api = require("../API/communicator");
const { promises, createWriteStream } = require("fs");
const fs = promises;
const path = require("path");

const tasks = new listr([
    {
        title: "Signing into account",
        task: (ctx) => {
            ctx.api = new api(ctx.email, ctx.password, ctx.apikey);
            return ctx.api.connect();
        },
    },
    {
        title: "Getting account books",
        task: async (ctx) => {
            let books = await ctx.api.getAllBooks();
            let amount = books.count;
            books = await Promise.all(
                books.books.map(async (bookObj) => {
                    let bookData = await ctx.api.getBookData(bookObj.bookid);
                    return bookData;
                })
            );

            //TODO: fix no book in account.
            ctx.allBooks = books;
        },
    },
    {
        title: "Books selection",
        task: (ctx, task) => {
            //TODO: Fix flashing massege.
            //TODO: fix no books chosen.
            return new Observable(async (observer) => {
                let prompt = new MultiSelect({
                    name: "books",
                    message: "Please choose which books to download",
                    choices: ctx.allBooks.map((book) => {
                        return {
                            name: `${book.bookname} - ${book.author}`,
                            value: book.bookid,
                        };
                    }),
                    result(booksNames) {
                        let booksMap = new Map();
                        booksNames.forEach((name) => {
                            booksMap.set(
                                name,
                                this.options.choices.find(
                                    (choise) => choise.name === name
                                ).value
                            );
                        });
                        return booksMap;
                    },
                });

                ctx.desiredBooks = await prompt.run();

                task.title = `Selected ${ctx.desiredBooks.size} books`;
                observer.complete();
            });
        },
        skip: (ctx) => {
            if (ctx.all) {
                ctx.desiredBooks = ctx.allBooks.map((book) => book.bookid);
                return "All selected.";
            }
        },
    },
    {
        title: "Downloading books",
        task: (ctx, task) => {
            return new Observable(async (observer) => {
                let downloadedBooksAmount = 0;
                for (const [bookName, bookId] of ctx.desiredBooks.entries()) {
                    try {
                        observer.next(`Downloading ${bookName}...`);

                        await ctx.api.getBook(
                            bookId,
                            path.join(ctx.directory, `${bookName}.epub`)
                        );

                        observer.next(`Downloaded ${bookName}!`);

                        downloadedBooksAmount++;
                    } catch (error) {
                        observer.next(`❌ Failed downloading ${bookName}`);
                        throw error;
                    }
                }
                //ctx.desiredBooks.forEach(async (bookId, bookName) => {});
                task.title = `Successfully downloaded ${downloadedBooksAmount}/${ctx.desiredBooks.size} books.`;
                observer.complete();
            });
        },
    },
]);

module.exports = tasks;
