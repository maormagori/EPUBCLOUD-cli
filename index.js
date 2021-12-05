#! /usr/bin/env node

const options = require("./cli/program").parse().opts();
const tasks = require("./cli/tasks");

const validateOpts = (opts) => {
    //TODO: Add validation
};

validateOpts(options);

//run tasks
tasks.run(options);
