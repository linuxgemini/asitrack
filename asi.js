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


		const data = $("#post-data-harita > div > div.svg-turkiye-haritasi > script");
		for (const init of data) {
			const intxt = strProcess(init.children[0].data);
			if (!varRegExp.test(intxt)) continue;

			const parsingArr = intxt.split(/\s+/);
			const obj = JSON.parse(`{"${parsingArr[1]}": "${removeQuote(parsingArr[3])}"}`);
			vals = {...vals, ...obj};
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
	const lastUpdated = now.hour(hour).minute(minute).second(0).millisecond(0).toDate();

	const final = {
		vaccinatedPeopleCount,
		lastUpdated
	};

	console.log(now.unix());
	return final;
};

module.exports = main;
