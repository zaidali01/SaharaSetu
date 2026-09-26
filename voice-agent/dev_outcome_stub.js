// DEV ONLY — stands in for backend POST /api/calls/outcome so the payload
// can be verified without Postgres. Not used in the demo.
const express = require('express');
const app = express();
app.use(express.json());
app.post('/api/calls/outcome', (req, res) => {
    console.log('[STUB] outcome received:\n' + JSON.stringify(req.body, null, 2));
    res.json({ success: true, stub: true });
});
app.listen(4001, () => console.log('Outcome stub on http://localhost:4001'));