"use strict";

const cheerio		=	require("cheerio");
const dayjs		=	require("dayjs");
const fetch		=	require("node-fetch");
const utc		=	require("dayjs/plugin/utc");
const varRegExp		=	/^var [\w\d]+ = [\w\d:'"]+;?$/i;

require("dayjs/locale/tr");
dayjs.locale("en");
dayjs.extend(utc);

const numberProcess = (str) => parseInt(str.replace(/^(\s+)|(\s+)$/g, "").replace(/,|\./g, ""), 10);
const strProcess = (str) => str.replace(/^(\s+)|(\s+)$/g, "").replace(/;+$/, "").toLowerCase();
const removeQuote = (str) => str.replace(/^("|')|("|')$/g, "");

const getRaw = async () => {
    let vals = {};

    try {
        const page = await fetch("https://covid19asi.saglik.gov.tr/");
        if (!page.ok) throw new Error("boink");

        const txt = await page.text();
        const $ = cheerio.load(txt);

        for (const init of $("script")) {
            for (const children of init.children) {
                const intxt = strProcess(children.data);
                if (!varRegExp.test(intxt)) continue;

                const parsingArr = intxt.split(/\s+/);
                const obj = JSON.parse(`{"${parsingArr[1]}": "${removeQuote(parsingArr[3])}"}`);
                vals = {...vals, ...obj};
            }
        }

        vals["cities"] = {};

        for (const data of $("g")) {
            for (const childrendata of data.children) {
                const attribs = childrendata.attribs;
                if (!attribs) continue;
                if (!attribs["data-adi"]) continue;

                const cityName = attribs["data-adi"];
                const firstDoseCount = numberProcess(attribs["data-birinci-doz"]);
                const secondDoseCount = numberProcess(attribs["data-ikinci-doz"]);
                const totalCount = numberProcess(attribs["data-toplam"]);
    
                const calculatedTotalCount = firstDoseCount + secondDoseCount;
                const doesTotalCountMatchCalculation = totalCount === calculatedTotalCount;
    
                if (cityName && cityName.length > 0) vals["cities"][cityName] = {
                    firstDoseCount,
                    secondDoseCount,
                    totalCount,
                    calculatedTotalCount,
                    doesTotalCountMatchCalculation
                };
            }
        }

        return vals;
    } catch (e) {
        return vals;
    }
};

const main = async () => {
    const now =  dayjs().utcOffset(3);

    const vals = await getRaw();

    const timeExists = (vals.asisayisiguncellemesaati ? true : false);
    const vaxCountExists = (vals.asiyapilankisisayisi ? true : false);
    const firstDoseCountExists = (vals.asiyapilankisisayisi1doz ? true : false);
    const secondDoseCountExists = (vals.asiyapilankisisayisi2doz ? true : false);
    const totalDoseCountExists = (vals.yapilanasisayisi ? true : false);
    const citiesDataExists = (Object.keys(vals.cities) === 0 ? false : true);
    const isFailed = (!firstDoseCountExists && !secondDoseCountExists);

    const hour = (timeExists ? parseInt(vals.asisayisiguncellemesaati.split(":")[0], 10) : now.hour());
    const minute = (timeExists ? parseInt(vals.asisayisiguncellemesaati.split(":")[1], 10) : now.minute());

    // legacy
    const vaccinatedPeopleCount = (vaxCountExists ? parseInt(vals.asiyapilankisisayisi, 10) : NaN);

    // latest
    const firstDoseCount = (firstDoseCountExists ? parseInt(vals.asiyapilankisisayisi1doz, 10) : NaN);
    const secondDoseCount = (secondDoseCountExists ? parseInt(vals.asiyapilankisisayisi2doz, 10) : NaN);
    const totalCount = (totalDoseCountExists ? parseInt(vals.yapilanasisayisi, 10) : NaN);

    const calculatedTotalCount = firstDoseCount + secondDoseCount;
    const doesTotalCountMatchCalculation = totalCount === calculatedTotalCount;

    const cities = (citiesDataExists ? vals.cities : {});

    const lastUpdated = now.hour(hour).minute(minute).second(0).millisecond(0).toDate();

    const final = {
        isFailed,
        vaccinatedPeopleCount,
        vaccinatedPeople: {
            firstDoseCount,
            secondDoseCount,
            totalCount,
            calculatedTotalCount,
            doesTotalCountMatchCalculation,
            cities
        },
        lastUpdated
    };

    return final;
};

module.exports = main;
