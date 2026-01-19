import { createApp } from './app';
import dotenv from 'dotenv';

dotenv.config();

const app = createApp();
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
