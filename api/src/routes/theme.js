import express from 'express';
import { getAllThemeSettings, updateThemeSetting, updateMultipleThemeSettings } from '../controllers/themeController.js';

const router = express.Router();

router.get('/', getAllThemeSettings);
router.put('/:key', updateThemeSetting);
router.put('/', updateMultipleThemeSettings);

export default router;
