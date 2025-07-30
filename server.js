const express = require('express');
const authRouter = require('./router/auth-router.js'); 
const db = require('./db/utils.js'); 

const app = express();
app.use(express.json());
app.use('/api/event/auth', authRouter);

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
