import dotenv from 'dotenv';
dotenv.config();

import { setupListeners } from './indexer/event-indexer';

setupListeners();
