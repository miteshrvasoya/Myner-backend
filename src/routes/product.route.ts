import { Router } from 'express';
import { createProduct, handleProductSearch, importTelegramProducts } from '../controllers/product.controller';

const router = Router();

router.post('/', createProduct);
router.get('/search', handleProductSearch);
router.post('/import', importTelegramProducts);

export default router;
