import {script} from '@digshare/script';

import {CookieJar} from 'tough-cookie';

const USER_ID = '3079173340';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 Edg/115.0.1901.203';

const PAGE_URL = `https://xueqiu.com/u/${encodeURIComponent(USER_ID)}#/stock`;

const PROFILE_API_URL = `https://xueqiu.com/statuses/original/show.json?user_id=${encodeURIComponent(
  USER_ID,
)}`;

const STOCKS_API_URL = `https://stock.xueqiu.com/v5/stock/portfolio/stock/list.json?pid=-1&category=1&size=10000&uid=${encodeURIComponent(
  USER_ID,
)}`;

interface State {
  cookies?: CookieJar.Serialized;
  stocks?: Record<string, string>;
}

export default script<State>(async ({cookies, stocks: stockDict} = {}) => {
  const cookieJar = cookies
    ? CookieJar.deserializeSync(cookies)
    : new CookieJar();

  const {headers} = await fetch(PAGE_URL, {
    headers: {
      'User-Agent': UA,
      Cookie: cookieJar.getCookieStringSync(PAGE_URL),
    },
  });

  for (const setCookieHeader of headers.getSetCookie()) {
    cookieJar.setCookieSync(setCookieHeader, PAGE_URL);
  }

  const apiFetchOptions = {
    headers: {
      'User-Agent': UA,
      Referer: PAGE_URL.replace(/#.*/, ''),
      Cookie: cookieJar.getCookieStringSync(STOCKS_API_URL),
    },
  };

  const {data, error_code, error_description} = (await fetch(
    STOCKS_API_URL,
    apiFetchOptions,
  ).then(response => response.json())) as {
    data: {
      stocks: StockPick[];
    };
    error_code: number;
    error_description: string;
  };

  if (error_code !== 0) {
    console.error(error_code, error_description);
    return;
  }

  const latestStocks = data.stocks;

  const latestStockDict = Object.fromEntries(
    latestStocks.map(stock => [stock.symbol, stock.name]),
  );

  const state = {
    cookies: cookieJar.serializeSync(),
    stocks: latestStockDict,
  };

  if (!stockDict) {
    console.info(`初始化自选股票列表，共 ${latestStocks.length} 只股票`);

    return {
      state,
    };
  }

  const {
    user: {screen_name: screenName},
  } = await fetch(PROFILE_API_URL, apiFetchOptions).then(response =>
    response.json(),
  );

  const addedStocks: StockPick[] = [];

  for (const {symbol, name} of latestStocks) {
    if (symbol in stockDict) {
      delete stockDict[symbol];
    } else {
      addedStocks.push({symbol, name});
    }
  }

  const removedStocks: StockPick[] = Object.entries(stockDict).map(
    ([symbol, name]) => {
      return {symbol, name};
    },
  );

  const updates = [
    ...addedStocks.map(
      stock =>
        `- + ${stock.name} ([${stock.symbol}](https://xueqiu.com/S/${stock.symbol}))`,
    ),
    ...removedStocks.map(
      stock =>
        `- - ${stock.name} ([${stock.symbol}](https://xueqiu.com/S/${stock.symbol}))`,
    ),
  ];

  if (updates.length === 0) {
    console.info('没有发现自选股票更新');
    return;
  }

  return {
    message: {
      title: `${screenName}的自选股票列表更新了`,
      content: `\
${updates.join('\n')}

来源：[${screenName} - 雪球](${PAGE_URL})
`,
    },
    state,
  };
});

interface StockPick {
  symbol: string;
  name: string;
}
