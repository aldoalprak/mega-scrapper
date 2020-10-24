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

const main = async() => {
  const startTime = performance.now();
  let categoryList = await getCategoryList();
  let result = {};

  for(let i = 0; i<categoryList.length; i++) {
    let promises = [];
    for(let j = 1; j<=categoryList[i].totalPage;j++) {
      const categoryIndex = categoryList[i].categoryIndex;
      const pageIndex = j;
      promises.push(promoPerPage(categoryIndex, pageIndex))
    }
    const allPromoPerCategory = await Promise.all(promises);
    const flattenCategory = [].concat.apply([], allPromoPerCategory);// transform to 1 dimension array
    console.log(`==total promo for ${categoryList[i].title}== ${flattenCategory.length}`)
    result[categoryList[i].title] = flattenCategory;
  }

  const totalTime = performance.now() - startTime;
  console.log(`scrapping time => ${Math.floor(totalTime/1000)} s`);
  const solution = JSON.stringify(result, null, 4);
  fs.writeFileSync("solution.json", solution);
}

main();