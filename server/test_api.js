const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testFlow() {
    try {
        // 1. Get Guest Token
        console.log('Requesting guest token...');
        const authRes = await axios.post(`${API_URL}/auth/guest`);
        console.log('Auth Response:', authRes.data);
        const token = authRes.data.token;

        if (!token) throw new Error('No token received');

        // 2. Post Opinion
        console.log('Posting opinion...');
        const opinionRes = await axios.post(`${API_URL}/opinions`, {
            content: 'Test opinion from script',
            topic: 'tech'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Post Opinion Response:', opinionRes.status, opinionRes.data);

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

testFlow();
