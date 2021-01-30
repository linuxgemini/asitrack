"use strict";

const getAsi	=	require("./asi");
const fs	=	require("fs");

const main = async () => {
	const data = await getAsi();
	fs.writeFileSync("./asibilgisi.json", JSON.stringify(data, null, 4));
	return null;
};

setInterval(main, (30 * 1000)); // execute almost every half minute

main();

