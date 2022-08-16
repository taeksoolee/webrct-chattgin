const fs = require("fs");
const keys_dir = "/secure/"; // 키 파일이 위치
// const ca = fs.readFileSync(keys_dir + "ca.ca-bundle");
const key = fs.readFileSync(__dirname + keys_dir + "rootca.key");
const cert = fs.readFileSync(__dirname + keys_dir + "rootca.crt");

module.exports.options = {
  key,
  cert,
  // ca,
};