const axios = require('axios');
const { authenticator } = require('otplib');

const BASE = 'https://apiconnect.angelone.in';

// Login to Angel One and get session token
const login = async (apiKey, clientId, password, totpSecret) => {
  const totp = totpSecret ? authenticator.generate(totpSecret) : '';
  const res = await axios.post(`${BASE}/rest/auth/angelbroking/user/v1/loginByPassword`, {
    clientcode: clientId,
    password,
    totp
  }, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-UserType': 'USER',
      'X-SourceID': 'WEB',
      'X-ClientLocalIP': '127.0.0.1',
      'X-ClientPublicIP': '127.0.0.1',
      'X-MACAddress': '00:00:00:00:00:00',
      'X-PrivateKey': apiKey
    }
  });
  if (!res.data.data?.jwtToken) throw new Error('Angel login failed: ' + JSON.stringify(res.data));
  return res.data.data.jwtToken;
};

// Place order
const placeOrder = async ({ apiKey, clientId, password, totpSecret }, orderParams) => {
  const jwtToken = await login(apiKey, clientId, password, totpSecret);

  const { symbol, action, qty, order_type, exchange = 'NSE', product = 'INTRADAY', price = 0 } = orderParams;

  const payload = {
    variety: 'NORMAL',
    tradingsymbol: symbol,
    symboltoken: orderParams.token || '',   // symbol token needed for Angel — user should provide or we lookup
    transactiontype: action.toUpperCase(),  // BUY or SELL
    exchange: exchange.toUpperCase(),
    ordertype: order_type.toUpperCase(),    // MARKET or LIMIT
    producttype: product.toUpperCase(),     // INTRADAY or DELIVERY
    duration: 'DAY',
    price: order_type.toUpperCase() === 'LIMIT' ? String(price) : '0',
    quantity: String(qty)
  };

  const res = await axios.post(`${BASE}/rest/secure/angelbroking/order/v1/placeOrder`, payload, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-UserType': 'USER',
      'X-SourceID': 'WEB',
      'X-ClientLocalIP': '127.0.0.1',
      'X-ClientPublicIP': '127.0.0.1',
      'X-MACAddress': '00:00:00:00:00:00',
      'X-PrivateKey': apiKey,
      'Authorization': `Bearer ${jwtToken}`
    }
  });

  if (!res.data.status) throw new Error('Order failed: ' + JSON.stringify(res.data));
  return res.data.data; // { orderid, ... }
};

module.exports = { placeOrder };
