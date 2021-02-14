"use strict";

const dayjs	=	require("dayjs");
const fs	=	require("fs");
const getAsi	=	require("./asi");

const main = async () => {
    const now =  dayjs().utcOffset(3);
    const data = await getAsi();

    if (data.isFailed) return;
    delete data.isFailed;

    fs.writeFileSync("./asibilgisi.json", JSON.stringify(data, null, 4));
    console.log(now.unix());
    return null;
};

setInterval(main, (30 * 1000)); // execute almost every half minute

main();

