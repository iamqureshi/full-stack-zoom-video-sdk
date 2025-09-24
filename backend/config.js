const dotenv = require('dotenv')
dotenv.config();

const config = {
    SDK_KEY:process.env.SDK_KEY || "",
    SDK_SECRET:process.env.SDK_SECRET || "",
    API_KEY:process.env.API_KEY|| "",
    API_SECRET:process.env.API_SECRET|| "",
    SECRET_TOKEN:process.env.SECRET_TOKEN|| "",
}

module.exports = config;