require('dotenv').config(); 
const axios = require('axios');

const cookie = process.env.ROBLOX_COOKIE;

axios.get('https://users.roblox.com/v1/users/authenticated', {
  headers: {
    Cookie: `.ROBLOSECURITY=${cookie}`,
    'User-Agent': 'Roblox/WinHttp'
  }
}).then(res => {
  console.log('✅ Cookie is valid for user:', res.data.name);
}).catch(err => {
  console.error('❌ Cookie is invalid or blocked:', err.response?.status, err.response?.data);
});
