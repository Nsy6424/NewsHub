// Script test API endpoints
const BASE_URL = 'http://localhost:3000/api';

async function testAPI() {
  console.log('🚀 Testing NewsHub API Endpoints\n');

  try {
    // Test 1: Get categories
    console.log('📂 Testing GET /api/categories...');
    const categoriesResponse = await fetch(`${BASE_URL}/categories`);
    const categories = await categoriesResponse.json();

    if (categoriesResponse.ok) {
      console.log('✅ Categories API working!');
      console.log(`📊 Found ${categories.length} categories:`);
      categories.forEach(cat => {
        console.log(`   - ${cat.name} (${cat._count.articles} articles)`);
      });
    } else {
      console.log('❌ Categories API failed:', categories);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Get articles (no filter)
    console.log('📰 Testing GET /api/articles (all articles)...');
    const articlesResponse = await fetch(`${BASE_URL}/articles`);
    const articlesData = await articlesResponse.json();

    if (articlesResponse.ok) {
      console.log('✅ Articles API working!');
      console.log(`📊 Found ${articlesData.articles.length} articles, total: ${articlesData.pagination.total}`);
      console.log('📄 Pagination:', articlesData.pagination);
      console.log('📰 Sample articles:');
      articlesData.articles.slice(0, 3).forEach((article, index) => {
        console.log(`   ${index + 1}. "${article.title}" by ${article.author} (${article.category})`);
      });
    } else {
      console.log('❌ Articles API failed:', articlesData);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Get articles with category filter
    if (categories.length > 0) {
      const firstCategory = categories[0].name;
      console.log(`🔍 Testing GET /api/articles?category=${encodeURIComponent(firstCategory)}...`);
      const filteredResponse = await fetch(`${BASE_URL}/articles?category=${encodeURIComponent(firstCategory)}`);
      const filteredData = await filteredResponse.json();

      if (filteredResponse.ok) {
        console.log(`✅ Filtered articles API working for category "${firstCategory}"!`);
        console.log(`📊 Found ${filteredData.articles.length} articles in this category`);
      } else {
        console.log('❌ Filtered articles API failed:', filteredData);
      }
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 4: Get articles with search
    console.log('🔎 Testing GET /api/articles?search=AI...');
    const searchResponse = await fetch(`${BASE_URL}/articles?search=AI`);
    const searchData = await searchResponse.json();

    if (searchResponse.ok) {
      console.log('✅ Search articles API working!');
      console.log(`📊 Found ${searchData.articles.length} articles matching "AI"`);
      if (searchData.articles.length > 0) {
        console.log('📰 Found articles:');
        searchData.articles.forEach((article, index) => {
          console.log(`   ${index + 1}. "${article.title}"`);
        });
      }
    } else {
      console.log('❌ Search articles API failed:', searchData);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 5: Get article detail (using first article's slug)
    if (articlesData.articles && articlesData.articles.length > 0) {
      const firstArticleSlug = articlesData.articles[0].slug;
      console.log(`📖 Testing GET /api/articles/${firstArticleSlug}...`);
      const detailResponse = await fetch(`${BASE_URL}/articles/${firstArticleSlug}`);
      const articleDetail = await detailResponse.json();

      if (detailResponse.ok) {
        console.log('✅ Article detail API working!');
        console.log('📄 Article details:');
        console.log(`   Title: "${articleDetail.title}"`);
        console.log(`   Author: ${articleDetail.author} (${articleDetail.author_email})`);
        console.log(`   Category: ${articleDetail.category}`);
        console.log(`   Published: ${new Date(articleDetail.published_at).toLocaleDateString('vi-VN')}`);
        console.log(`   Content preview: ${articleDetail.content.substring(0, 100)}...`);
      } else {
        console.log('❌ Article detail API failed:', articleDetail);
      }
    }

    console.log('\n' + '='.repeat(50) + '\n');
    console.log('🎉 All API tests completed!');

  } catch (error) {
    console.error('❌ Network error:', error.message);
    console.log('\n💡 Make sure your Next.js dev server is running: npm run dev');
    console.log('💡 Also ensure your database is set up and seeded with data');
  }
}

// Run the test
testAPI();
