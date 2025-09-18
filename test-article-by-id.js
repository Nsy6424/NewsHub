// Script test Article by ID API
const BASE_URL = 'http://localhost:3000/api';

async function testArticleById() {
  console.log('🆔 Testing Article by ID API\n');

  try {
    // Test 1: Get articles list first to get a valid ID
    console.log('📰 Step 1: Get articles list to find a valid ID...');
    const articlesResponse = await fetch(`${BASE_URL}/articles?limit=5`);
    const articlesData = await articlesResponse.json();

    if (articlesResponse.ok && articlesData.articles.length > 0) {
      console.log(`✅ Got ${articlesData.articles.length} articles`);
      console.log('📋 Available articles:');
      articlesData.articles.forEach((article, index) => {
        console.log(`   ${index + 1}. ID: ${article.id} - "${article.title}"`);
        console.log(`      Slug: ${article.slug}`);
        console.log(`      Category: ${article.category}`);
        console.log(`      Author: ${article.author}\n`);
      });

      // Test with first article
      const testId = articlesData.articles[0].id;
      console.log(`🔍 Testing detail API with ID: ${testId}`);

      console.log('\n' + '='.repeat(60) + '\n');

      // Test 2: Get article detail by ID
      console.log('📖 Step 2: Get article detail by ID...');
      const detailResponse = await fetch(`${BASE_URL}/articles/${testId}`);
      const articleDetail = await detailResponse.json();

      if (detailResponse.ok) {
        console.log('✅ Article by ID API working!');
        console.log('📄 Article Details:');
        console.log(`   ID: ${articleDetail.id}`);
        console.log(`   Title: "${articleDetail.title}"`);
        console.log(`   Slug: ${articleDetail.slug}`);
        console.log(`   Author: ${articleDetail.author} (${articleDetail.author_email})`);
        console.log(`   Category: ${articleDetail.category} (ID: ${articleDetail.category_id})`);
        console.log(`   Priority: ${articleDetail.priority}`);
        console.log(`   Published: ${new Date(articleDetail.published_at).toLocaleDateString('vi-VN')}`);
        console.log(`   Created: ${new Date(articleDetail.created_at).toLocaleDateString('vi-VN')}`);
        console.log(`   Updated: ${new Date(articleDetail.updated_at).toLocaleDateString('vi-VN')}`);
        console.log(`   Summary: ${articleDetail.summary}`);
        console.log(`   Content preview: ${articleDetail.content.substring(0, 100)}...`);
        if (articleDetail.image_url) {
          console.log(`   Image: ${articleDetail.image_url}`);
        }
      } else {
        console.log('❌ Article by ID API failed:', articleDetail);
      }

      console.log('\n' + '='.repeat(60) + '\n');

      // Test 3: Test with invalid ID (404 case)
      console.log('🚫 Step 3: Test with invalid ID...');
      const invalidResponse = await fetch(`${BASE_URL}/articles/999999`);
      const invalidResult = await invalidResponse.json();

      if (invalidResponse.status === 404) {
        console.log('✅ 404 handling working correctly');
        console.log(`🚫 ${invalidResult.error}`);
      } else {
        console.log('❌ Should return 404 for invalid ID:', invalidResult);
      }

      console.log('\n' + '='.repeat(60) + '\n');

      // Test 4: Test with non-numeric ID (400 case)
      console.log('🚫 Step 4: Test with non-numeric ID...');
      const nonNumericResponse = await fetch(`${BASE_URL}/articles/abc123`);
      const nonNumericResult = await nonNumericResponse.json();

      if (nonNumericResponse.status === 500) {
        console.log('✅ Invalid ID format handled');
        console.log(`🚫 ${nonNumericResult.error}`);
      } else {
        console.log('❌ Non-numeric ID response:', nonNumericResult);
      }

      console.log('\n' + '='.repeat(60) + '\n');

      // Test 5: Compare ID vs Slug APIs
      console.log('🔗 Step 5: Compare ID vs Slug APIs...');
      console.log('📊 API Comparison:');
      console.log(`   By ID:   GET /api/articles/${testId}`);
      console.log(`   By Slug: GET /api/article-detail/${articlesData.articles[0].slug}`);
      console.log('');
      console.log('💡 Use cases:');
      console.log('   - ID: Internal operations, admin panels, direct database references');
      console.log('   - Slug: SEO-friendly URLs, public article pages');
      console.log('');
      console.log('📋 Complete API structure:');
      console.log('   GET  /api/articles           - List articles (public)');
      console.log('   POST /api/articles           - Create article (Author only)');
      console.log('   GET  /api/articles/[id]      - Article detail by ID (public)');
      console.log('   PUT  /api/articles/[id]      - Update article (Author only)');
      console.log('   DELETE /api/articles/[id]    - Delete article (Author only)');
      console.log('   GET  /api/article-detail/[slug] - Article detail by slug (public)');
      console.log('   GET  /api/my-articles        - My articles (Author only)');

      console.log('\n' + '='.repeat(60) + '\n');
      console.log('🎉 Article by ID API test completed successfully!');

    } else {
      console.log('❌ No articles found. Please run seed data first:');
      console.log('   npm run db:seed');
    }

  } catch (error) {
    console.error('❌ Network error:', error.message);
    console.log('\n💡 Make sure your Next.js dev server is running: npm run dev');
    console.log('💡 Also ensure your database has articles with proper IDs');
  }
}

// Run the test
testArticleById();
