// Script test Author Management API endpoints
const BASE_URL = 'http://localhost:3000/api';

async function testAuthorAPI() {
  console.log('✍️ Testing Author Management API Endpoints\n');

  let authToken = null;
  let authorId = null;
  let categoryId = null;
  let createdArticleId = null;

  try {
    // Step 1: Register an Author
    console.log('📝 Step 1: Register Author...');
    const registerData = {
      name: 'Author Test',
      email: `author${Date.now()}@test.com`,
      password: 'password123',
      role: 'author'
    };

    const registerResponse = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerData)
    });

    const registerResult = await registerResponse.json();
    if (registerResponse.ok) {
      console.log('✅ Author registered successfully');
      console.log(`👤 Author: ${registerResult.user.name} (${registerResult.user.role})`);
      authorId = registerResult.user.id;
    } else {
      console.log('❌ Failed to register author:', registerResult);
      return;
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Step 2: Login as Author
    console.log('🔑 Step 2: Login as Author...');
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: registerData.email,
        password: registerData.password
      })
    });

    const loginResult = await loginResponse.json();
    if (loginResponse.ok) {
      console.log('✅ Author logged in successfully');
      authToken = loginResult.token;
    } else {
      console.log('❌ Failed to login:', loginResult);
      return;
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Step 3: Get categories (to use for creating article)
    console.log('📂 Step 3: Get categories...');
    const categoriesResponse = await fetch(`${BASE_URL}/categories`);
    const categories = await categoriesResponse.json();
    
    if (categoriesResponse.ok && categories.length > 0) {
      categoryId = categories[0].id;
      console.log(`✅ Got categories, using: ${categories[0].name} (ID: ${categoryId})`);
    } else {
      console.log('❌ No categories available, creating article may fail');
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Step 4: Create new article
    console.log('📰 Step 4: Create new article...');
    const articleData = {
      title: 'Bài viết test từ API',
      summary: 'Đây là tóm tắt bài viết test được tạo từ API',
      content: '<p>Đây là nội dung chi tiết của bài viết test. Bài viết này được tạo bởi Author thông qua API.</p><p>Nội dung có thể chứa HTML và được lưu trữ trong database.</p>',
      image_url: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=400&fit=crop',
      category_id: categoryId,
      priority: 5
    };

    const createResponse = await fetch(`${BASE_URL}/articles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(articleData)
    });

    const createResult = await createResponse.json();
    if (createResponse.ok) {
      console.log('✅ Article created successfully');
      console.log(`📄 Article: "${createResult.article.title}"`);
      console.log(`🔗 Slug: ${createResult.article.slug}`);
      console.log(`📂 Category: ${createResult.article.category}`);
      createdArticleId = createResult.article.id;
    } else {
      console.log('❌ Failed to create article:', createResult);
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Step 5: Get my articles
    console.log('📚 Step 5: Get my articles...');
    const myArticlesResponse = await fetch(`${BASE_URL}/my-articles?page=1&limit=5`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    const myArticlesResult = await myArticlesResponse.json();
    if (myArticlesResponse.ok) {
      console.log('✅ Got my articles successfully');
      console.log(`📊 Total articles: ${myArticlesResult.stats.total_articles}`);
      console.log('📰 My articles:');
      myArticlesResult.articles.forEach((article, index) => {
        console.log(`   ${index + 1}. "${article.title}" (${article.category})`);
        console.log(`      Updated: ${new Date(article.updated_at).toLocaleDateString('vi-VN')}`);
      });

      if (myArticlesResult.stats.by_category.length > 0) {
        console.log('📊 Articles by category:');
        myArticlesResult.stats.by_category.forEach(stat => {
          console.log(`   - ${stat.category}: ${stat.count} bài`);
        });
      }
    } else {
      console.log('❌ Failed to get my articles:', myArticlesResult);
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Step 6: Update article
    if (createdArticleId) {
      console.log('✏️ Step 6: Update article...');
      const updateData = {
        title: 'Bài viết test đã được cập nhật',
        summary: 'Tóm tắt đã được cập nhật',
        priority: 8
      };

      const updateResponse = await fetch(`${BASE_URL}/articles/${createdArticleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(updateData)
      });

      const updateResult = await updateResponse.json();
      if (updateResponse.ok) {
        console.log('✅ Article updated successfully');
        console.log(`📄 New title: "${updateResult.article.title}"`);
        console.log(`⭐ New priority: ${updateResult.article.priority}`);
      } else {
        console.log('❌ Failed to update article:', updateResult);
      }

      console.log('\n' + '='.repeat(60) + '\n');

      // Step 7: Try to delete article
      console.log('🗑️ Step 7: Delete article...');
      const deleteResponse = await fetch(`${BASE_URL}/articles/${createdArticleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const deleteResult = await deleteResponse.json();
      if (deleteResponse.ok) {
        console.log('✅ Article deleted successfully');
        console.log(`🗑️ Deleted: "${deleteResult.deleted_article.title}"`);
      } else {
        console.log('❌ Failed to delete article:', deleteResult);
      }
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Step 8: Test unauthorized access (Reader trying to create article)
    console.log('🚫 Step 8: Test Reader trying to create article...');
    
    // Register a Reader
    const readerData = {
      name: 'Reader Test',
      email: `reader${Date.now()}@test.com`,
      password: 'password123',
      role: 'reader'
    };

    const readerRegResponse = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(readerData)
    });

    if (readerRegResponse.ok) {
      // Login as Reader
      const readerLoginResponse = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: readerData.email,
          password: readerData.password
        })
      });

      const readerLoginResult = await readerLoginResponse.json();
      if (readerLoginResponse.ok) {
        // Try to create article as Reader
        const unauthorizedResponse = await fetch(`${BASE_URL}/articles`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${readerLoginResult.token}`
          },
          body: JSON.stringify(articleData)
        });

        const unauthorizedResult = await unauthorizedResponse.json();
        if (unauthorizedResponse.status === 403) {
          console.log('✅ Authorization working correctly');
          console.log(`🚫 ${unauthorizedResult.error}`);
        } else {
          console.log('❌ Authorization should prevent Reader from creating articles');
        }
      }
    }

    console.log('\n' + '='.repeat(60) + '\n');
    console.log('🎉 All Author Management API tests completed!');

  } catch (error) {
    console.error('❌ Network error:', error.message);
    console.log('\n💡 Make sure your Next.js dev server is running: npm run dev');
    console.log('💡 Also ensure your database is set up with categories');
  }
}

// Run the test
testAuthorAPI();
