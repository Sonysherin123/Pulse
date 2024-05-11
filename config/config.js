const sessionSecret = "mysitesessionsecret";
require('dotenv').config()

const  emailUser = process.env.emailUser;
const emailPassword = process.env.emailPassword;
module.exports = {
    sessionSecret,
    emailUser,
    emailPassword
}