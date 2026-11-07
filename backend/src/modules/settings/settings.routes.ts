import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth';
import { getSettings, updateSettings } from './settings.controller';

export const settingsRouter = Router();

settingsRouter.get('/', authenticate, requireAdmin, getSettings);
settingsRouter.put('/', authenticate, requireAdmin, updateSettings);
