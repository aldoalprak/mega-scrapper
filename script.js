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

const detailPageScrap = async(url) => {
  const pageResult = (await get(url)).body; 
  const $ = cheerio.load(pageResult);
  const promoArea = $(".area").text();
  const promoPeriod = $(".periode").text().replace(/(\n)/g, "").replace(/(\t)/g, "");
  const descImg = `${baseUrl}${$("img",".keteranganinside").attr("src")}`;

  const detailResult = {
    promoArea,
    promoPeriod,
    descImg
  };
  return detailResult;
}

const promoPerPage = async(categoryIndex, pageIndex) => {
  console.log("==promo page==",`category =>${categoryIndex}`, `page => ${pageIndex}`)
  const mainPage = await mainPageScrap(categoryIndex, pageIndex);
  const $ = cheerio.load(mainPage);
  const promises = [];

  
  $("#promolain").find("li").each((i, el) => {
    const detailPath = $("a", el).attr("href");
    const title = $("#imgClass", el).attr("title");
    const gridImg = `${baseUrl}/${$("#imgClass", el).attr("src")}`;

    const handleAsync = async() => {
      const detail = await detailPageScrap(`${baseUrl}/${detailPath}`);
      
      const promoInfo = {
        title,
        gridImg,
        ...detail
      };
      return promoInfo
    }
    promises.push(handleAsync())
  })
  
  const result = (await Promise.all(promises));
  return result;
}

const getCategoryList = async() => {
  const pageScrap = (await get(ccUrl)).body;
  const $ = cheerio.load(pageScrap);
  let categoryList = [];
  const categoriesLength = $("#subcatpromo").find("div").length;

  for(let i = 1; i <= categoriesLength;i++) {
    const pageScrap = (await get(`${ccUrl}&subcat=${i}`)).body;
    const $ = cheerio.load(pageScrap);

    const totalPageStr = $("#paging1").attr("title");
    const OfIndex = totalPageStr.indexOf("of");
    const totalPage = Number(totalPageStr.slice(OfIndex+2));
    
    const categoryTitle = $("img", "#subcatselected").attr("title")
    
    const categoryDetail  = {
      title: categoryTitle,
      totalPage,
      categoryIndex: i
    };

    categoryList.push(categoryDetail);
  }

  return categoryList;
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
  fs.writeFileSync("result.json", solution);
}

main();