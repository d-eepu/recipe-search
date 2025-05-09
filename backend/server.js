const express = require('express');
  const mongoose = require('mongoose');
  const axios = require('axios');
  const cors = require('cors');
  const path = require('path');
  const Category = require('./models/Category');

  const app = express();
  app.use(cors());
  app.use(express.json());

  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/recipe-app', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

  app.get('/api/categories', async (req, res) => {
    let categories = await Category.find();
    if (categories.length === 0) {
      const response = await axios.get('https://www.themealdb.com/api/json/v1/1/list.php?c=list');
      categories = response.data.meals.map(meal => ({ name: meal.strCategory }));
      await Category.insertMany(categories);
    }
    res.json(categories);
  });

  app.get('/api/recipes/search', async (req, res) => {
    const { name } = req.query;
    try {
      const response = await axios.get(`https://www.themealdb.com/api/json/v1/1/search.php?s=${name}`);
      res.json(response.data);
    } catch (err) {
      console.error(`Error searching recipes: ${name}`, err);
      res.status(500).json({ error: 'Failed to search recipes' });
    }
  });

  app.get('/api/recipes/filter', async (req, res) => {
    const { ingredient } = req.query;
    try {
      const response = await axios.get(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${ingredient}`);
      res.json(response.data);
    } catch (err) {
      console.error(`Error filtering by ingredient: ${ingredient}`, err);
      res.status(500).json({ error: 'Failed to filter recipes' });
    }
  });

  app.get('/api/recipes/category', async (req, res) => {
    const { category } = req.query;
    try {
      const response = await axios.get(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`);
      res.json(response.data);
    } catch (err) {
      console.error(`Error filtering by category: ${category}`, err);
      res.status(500).json({ error: 'Failed to filter by category' });
    }
  });

  app.get('/api/recipes/detail', async (req, res) => {
    const { id } = req.query;
    console.log(`Fetching recipe ID: ${id}`);
    try {
      const response = await axios.get(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
      console.log(`Response for ID ${id}:`, response.data);
      res.json(response.data);
    } catch (err) {
      console.error(`Error fetching recipe ID ${id}:`, err.message);
      res.status(500).json({ error: 'Failed to fetch recipe' });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'public')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
  }

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));