const fs = require("fs");
const {performance} = require("perf_hooks")
const Promise = require("bluebird");
const cheerio = require("cheerio");
const request = require("request");
const baseUrl = "https://www.bankmega.com";
const ccUrl = "https://www.bankmega.com/promolainnya.php?product=1"; // credit card promo url

const get = Promise.promisify(request.get);

const mainPageScrap = async(categoryIndex, pageIndex) => {
  const pageResult = (await get(`${ccUrl}&subcat=${categoryIndex}&page=${pageIndex}`)).body;
  return pageResult;
}
