"use strict";

const cheerio		=	require("cheerio");
const dayjs		=	require("dayjs");
const fetch		=	require("node-fetch");
const sleep		=	require("util").promisify(setTimeout);
const utc		=	require('dayjs/plugin/utc');
const varRegExp		=	/^var [\w\d]+ = [\w\d:'"]+;?$/i;

require("dayjs/locale/tr");
dayjs.locale("en");
dayjs.extend(utc)

const strProcess = (str) => str.replace(/^(\s+)|(\s+)$/g, "").replace(/;+$/, "").toLowerCase();
const removeQuote = (str) => str.replace(/^("|')|("|')$/g, "");

const getRaw = async _ => {
	let vals = {};

	try {
		const page = await fetch("https://covid19asi.saglik.gov.tr/");
		if (!page.ok) throw new Error("boink");

		const txt = await page.text();
		const $ = cheerio.load(txt);


		const data = $("script");
		for (const init of data) {
			for (const children of init.children) {
				const intxt = strProcess(children.data);
				if (!varRegExp.test(intxt)) continue;
	
				const parsingArr = intxt.split(/\s+/);
				const obj = JSON.parse(`{"${parsingArr[1]}": "${removeQuote(parsingArr[3])}"}`);
				vals = {...vals, ...obj};
			}
		}
	} catch (e) {
		throw e;
	} finally {
		return vals;
	}
};

const main = async _ => {
	const now =  dayjs().utcOffset(3);

	const vals = await getRaw();

	const hour = parseInt(vals.asisayisiguncellemesaati.split(":")[0], 10);
	const minute = parseInt(vals.asisayisiguncellemesaati.split(":")[1], 10);

	const vaccinatedPeopleCount = parseInt(vals.asiyapilankisisayisi, 10);
	const firstDoseCount = parseInt(vals.asiyapilankisisayisi1doz, 10);
	const secondDoseCount = parseInt(vals.asiyapilankisisayisi2doz, 10);
	const totalCount = parseInt(vals.yapilanasisayisi, 10);
	const calculatedTotalCount = firstDoseCount + secondDoseCount;
	const doesTotalCountMatchCalculation = totalCount === calculatedTotalCount;
	const lastUpdated = now.hour(hour).minute(minute).second(0).millisecond(0).toDate();

	const final = {
		vaccinatedPeopleCount,
		vaccinatedPeople: {
			firstDoseCount,
			secondDoseCount,
			totalCount,
			calculatedTotalCount,
			doesTotalCountMatchCalculation
		},
		lastUpdated
	};

	return final;
};

module.exports = main;
