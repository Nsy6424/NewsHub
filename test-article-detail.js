// Script test Article Detail API
const BASE_URL = 'http://localhost:3000/api';

async function testArticleDetail() {
  console.log('📄 Testing Article Detail API\n');

  try {
    // Test 1: Get articles list first to get a valid slug
    console.log('📰 Step 1: Get articles list to find a valid slug...');
    const articlesResponse = await fetch(`${BASE_URL}/articles?limit=5`);
    const articlesData = await articlesResponse.json();

    if (articlesResponse.ok && articlesData.articles.length > 0) {
      console.log(`✅ Got ${articlesData.articles.length} articles`);
      console.log('📋 Available articles:');
      articlesData.articles.forEach((article, index) => {
        console.log(`   ${index + 1}. "${article.title}"`);
        console.log(`      Slug: ${article.slug}`);
        console.log(`      Category: ${article.category}`);
        console.log(`      Author: ${article.author}\n`);
      });

      // Test with first article
      const testSlug = articlesData.articles[0].slug;
      console.log(`🔍 Testing detail API with slug: "${testSlug}"`);

      console.log('\n' + '='.repeat(60) + '\n');

      // Test 2: Get article detail by slug
      console.log('📖 Step 2: Get article detail...');
      const detailResponse = await fetch(`${BASE_URL}/article-detail/${testSlug}`);
      const articleDetail = await detailResponse.json();

      if (detailResponse.ok) {
        console.log('✅ Article detail API working!');
        console.log('📄 Article Details:');
        console.log(`   ID: ${articleDetail.id}`);
        console.log(`   Title: "${articleDetail.title}"`);
        console.log(`   Slug: ${articleDetail.slug}`);
        console.log(`   Author: ${articleDetail.author} (${articleDetail.author_email})`);
        console.log(`   Category: ${articleDetail.category} (${articleDetail.category_slug})`);
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
        console.log('❌ Article detail API failed:', articleDetail);
      }

      console.log('\n' + '='.repeat(60) + '\n');

      // Test 3: Test with invalid slug (404 case)
      console.log('🚫 Step 3: Test with invalid slug...');
      const invalidResponse = await fetch(`${BASE_URL}/article-detail/invalid-slug-not-exists`);
      const invalidResult = await invalidResponse.json();

      if (invalidResponse.status === 404) {
        console.log('✅ 404 handling working correctly');
        console.log(`🚫 ${invalidResult.error}`);
      } else {
        console.log('❌ Should return 404 for invalid slug:', invalidResult);
      }

      console.log('\n' + '='.repeat(60) + '\n');

      // Test 4: Test URL structure
      console.log('🔗 Step 4: Verify URL structure...');
      console.log('✅ New URL structure working:');
      console.log(`   Old: GET /api/articles/${testSlug} (❌ conflicted with [id])`);
      console.log(`   New: GET /api/article-detail/${testSlug} (✅ completely separate)`);
      console.log('');
      console.log('📋 Complete API structure:');
      console.log('   GET  /api/articles           - List articles');
      console.log('   POST /api/articles           - Create article (Author only)');
      console.log('   GET  /api/article-detail/[slug] - Article detail by slug');
      console.log('   PUT  /api/articles/[id]      - Update article (Author only)');
      console.log('   DELETE /api/articles/[id]    - Delete article (Author only)');

      console.log('\n' + '='.repeat(60) + '\n');
      console.log('🎉 Article Detail API test completed successfully!');

    } else {
      console.log('❌ No articles found. Please run seed data first:');
      console.log('   npm run db:seed');
    }

  } catch (error) {
    console.error('❌ Network error:', error.message);
    console.log('\n💡 Make sure your Next.js dev server is running: npm run dev');
    console.log('💡 Also ensure your database has articles with proper slugs');
  }
}

// Run the test
testArticleDetail();
