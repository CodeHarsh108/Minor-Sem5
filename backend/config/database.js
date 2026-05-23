const mongoose = require("mongoose");
const dns = require("dns");
require("dotenv").config();

// Use Google Public DNS so MongoDB Atlas SRV records resolve correctly
// (local router may not support DNS SRV queries)
dns.setServers(["8.8.8.8", "8.8.4.4"]);



console.log(process.env.DATA_BASE_URL)

exports.connect = () => {
	mongoose.connect(process.env.DATA_BASE_URL)
    .then(() => console.log("Database Connection is Successfull !! "))
    .catch( (error) => {
        console.log("Issue in DataBase Connection");
        console.error(error.message);
        // Don't exit - server keeps running
    } );
};
