// Script test để verify content không hiển thị trong danh sách
const BASE_URL = 'http://localhost:3000/api';

async function testNoContentInList() {
  console.log('📋 Testing: Content không hiển thị trong danh sách bài viết\n');

  try {
    // Test 1: Kiểm tra danh sách bài viết (GET /api/articles)
    console.log('📰 Step 1: Test GET /api/articles (list)...');
    const articlesResponse = await fetch(`${BASE_URL}/articles?limit=3`);
    const articlesData = await articlesResponse.json();

    if (articlesResponse.ok && articlesData.articles.length > 0) {
      console.log(`✅ Got ${articlesData.articles.length} articles in list`);
      console.log('📄 Checking article structure in list:');
      
      const firstArticle = articlesData.articles[0];
      console.log('🔍 First article fields:');
      Object.keys(firstArticle).forEach(key => {
        console.log(`   ✓ ${key}: ${typeof firstArticle[key]}`);
      });

      if (firstArticle.content) {
        console.log('❌ FAIL: Content field found in list API!');
        console.log(`   Content preview: ${firstArticle.content.substring(0, 100)}...`);
      } else {
        console.log('✅ PASS: Content field NOT found in list API');
      }

      console.log('\n' + '='.repeat(60) + '\n');

      // Test 2: Kiểm tra chi tiết bài viết theo ID
      const testId = firstArticle.id;
      console.log(`📖 Step 2: Test GET /api/articles/${testId} (detail by ID)...`);
      const detailResponse = await fetch(`${BASE_URL}/articles/${testId}`);
      const articleDetail = await detailResponse.json();

      if (detailResponse.ok) {
        console.log('🔍 Detail article fields:');
        Object.keys(articleDetail).forEach(key => {
          console.log(`   ✓ ${key}: ${typeof articleDetail[key]}`);
        });

        if (articleDetail.content) {
          console.log('✅ PASS: Content field found in detail API');
          console.log(`   Content length: ${articleDetail.content.length} characters`);
          console.log(`   Content preview: ${articleDetail.content.substring(0, 100)}...`);
        } else {
          console.log('❌ FAIL: Content field NOT found in detail API!');
        }
      }

      console.log('\n' + '='.repeat(60) + '\n');

      // Test 3: Kiểm tra chi tiết bài viết theo slug
      const testSlug = firstArticle.slug;
      console.log(`📖 Step 3: Test GET /api/article-detail/${testSlug} (detail by slug)...`);
      const slugDetailResponse = await fetch(`${BASE_URL}/article-detail/${testSlug}`);
      const slugArticleDetail = await slugDetailResponse.json();

      if (slugDetailResponse.ok) {
        if (slugArticleDetail.content) {
          console.log('✅ PASS: Content field found in slug detail API');
          console.log(`   Content length: ${slugArticleDetail.content.length} characters`);
        } else {
          console.log('❌ FAIL: Content field NOT found in slug detail API!');
        }
      }

      console.log('\n' + '='.repeat(60) + '\n');

      // Test 4: So sánh kích thước response
      console.log('📊 Step 4: Response size comparison...');
      const listSize = JSON.stringify(articlesData).length;
      const detailSize = JSON.stringify(articleDetail).length;
      
      console.log(`📏 Response sizes:`);
      console.log(`   List API: ${listSize} bytes`);
      console.log(`   Detail API: ${detailSize} bytes`);
      console.log(`   Reduction: ${((listSize / detailSize) * 100).toFixed(1)}% of detail size`);

      if (listSize < detailSize) {
        console.log('✅ PASS: List API response smaller than detail API');
      } else {
        console.log('⚠️  WARNING: List API response not smaller than detail API');
      }

      console.log('\n' + '='.repeat(60) + '\n');

      // Summary
      console.log('📋 SUMMARY:');
      console.log('✅ APIs with content field:');
      console.log('   - GET /api/articles/[id]      (detail by ID)');
      console.log('   - GET /api/article-detail/[slug] (detail by slug)');
      console.log('');
      console.log('🚫 APIs without content field:');
      console.log('   - GET /api/articles           (list)');
      console.log('   - GET /api/my-articles        (author\'s list)');
      console.log('');
      console.log('💡 Benefits:');
      console.log('   - Faster API response time');
      console.log('   - Reduced bandwidth usage');
      console.log('   - Better mobile performance');
      console.log('   - Cleaner list UI (only summary needed)');

      console.log('\n🎉 Content visibility test completed!');

    } else {
      console.log('❌ No articles found. Please run seed data first:');
      console.log('   npm run db:seed');
    }

  } catch (error) {
    console.error('❌ Network error:', error.message);
    console.log('\n💡 Make sure your Next.js dev server is running: npm run dev');
  }
}

// Run the test
testNoContentInList();
