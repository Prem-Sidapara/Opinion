const axios = require('axios');

async function testTopics() {
    try {
        console.log('Fetching topics from localhost:5000...');
        // Using localhost directly to bypass any potential client-side proxy issues for this test
        const response = await axios.get('http://localhost:5000/api/topics');
        console.log('Status:', response.status);
        console.log('Data Type:', typeof response.data);
        console.log('Is Array?', Array.isArray(response.data));
        console.log('Length:', response.data.length);
        console.log('Topics:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error fetching topics:', error.message);
        if (error.response) console.error('Response:', error.response.data);
    }
}

testTopics();
