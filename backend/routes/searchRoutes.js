const express = require('express');
const router  = express.Router();
const { getSuggestions, globalSearch } = require('../controllers/searchController');

router.get('/suggestions', getSuggestions);
router.get('/',            globalSearch);

module.exports = router;
