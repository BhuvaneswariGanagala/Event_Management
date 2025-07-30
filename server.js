const express = require('express');
const authRouter = require('./router/auth-router.js'); // Ensure the correct file extension
const db = require('./db/utils.js'); // Include the database connection

const app = express();
app.use(express.json());
app.use('/api/event/auth', authRouter);

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
