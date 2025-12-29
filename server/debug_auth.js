const axios = require('axios');

const API_URL = 'http://localhost:5000/api/auth';

async function testRegistration() {
    try {
        console.log('--- Auth Debug Test ---');
        const email = `test.user.${Date.now()}@gmail.com`;
        const password = 'password123';
        const username = 'TestUser';

        console.log(`Attempting to register: ${email}`);

        const res = await axios.post(`${API_URL}/register`, {
            email,
            password,
            username
        });

        console.log('Registration Success:', res.status, res.data);
    } catch (err) {
        if (err.response) {
            console.error('Registration Failed:', err.response.status, err.response.data);
        } else {
            console.error('Network/Server Error:', err.message);
        }
    }
}

testRegistration();
