const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testVoteLogic() {
    try {
        console.log('--- Starting Vote Logic Test ---');
        // 1. Get Guest Token
        const authRes = await axios.post(`${API_URL}/auth/guest`);
        const token = authRes.data.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        console.log('Got token');

        // 2. Create Opinion
        const opRes = await axios.post(`${API_URL}/opinions`, { content: 'Vote Test', topic: 'tech' }, config);
        const opId = opRes.data._id;
        console.log('Created opinion:', opId);

        // 3. Like (Helpful)
        console.log('Action: Like');
        let voteRes = await axios.patch(`${API_URL}/opinions/${opId}/vote`, { type: 'helpful' }, config);
        console.log(`Result: helpful=${voteRes.data.helpful}, userVote=${voteRes.data.userVote}`);
        if (voteRes.data.helpful !== 1 || voteRes.data.userVote !== 'helpful') throw new Error('Like failed');

        // 4. Like Again (Should Unlike)
        console.log('Action: Like again (expect unlike)');
        voteRes = await axios.patch(`${API_URL}/opinions/${opId}/vote`, { type: 'helpful' }, config);
        console.log(`Result: helpful=${voteRes.data.helpful}, userVote=${voteRes.data.userVote}`);
        if (voteRes.data.helpful !== 0 || voteRes.data.userVote !== null) throw new Error('Unlike failed');

        // 5. Dislike
        console.log('Action: Dislike');
        voteRes = await axios.patch(`${API_URL}/opinions/${opId}/vote`, { type: 'notHelpful' }, config);
        console.log(`Result: notHelpful=${voteRes.data.notHelpful}, userVote=${voteRes.data.userVote}`);
        if (voteRes.data.notHelpful !== 1 || voteRes.data.userVote !== 'notHelpful') throw new Error('Dislike failed');

        // 6. Switch (Like while Disliked)
        console.log('Action: Switch to Like');
        voteRes = await axios.patch(`${API_URL}/opinions/${opId}/vote`, { type: 'helpful' }, config);
        console.log(`Result: helpful=${voteRes.data.helpful}, notHelpful=${voteRes.data.notHelpful}, userVote=${voteRes.data.userVote}`);
        if (voteRes.data.helpful !== 1 || voteRes.data.notHelpful !== 0 || voteRes.data.userVote !== 'helpful') throw new Error('Switch failed');

        console.log('--- Test Passed ---');

    } catch (error) {
        console.error('Test Failed:', error.response ? error.response.data : error.message);
    }
}

testVoteLogic();
