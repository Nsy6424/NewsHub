// Script test POST article API
const BASE_URL = 'http://localhost:3000/api';

async function testPostArticle() {
  console.log('📝 Testing POST Article API\n');

  let authToken = null;

  try {
    // Step 1: Login as Author to get token
    console.log('🔑 Step 1: Login as Author...');
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'tacgia@test.com', // Email từ seed data
        password: 'password123'
      })
    });

    const loginResult = await loginResponse.json();

    if (loginResponse.ok) {
      console.log('✅ Login successful');
      authToken = loginResult.token;
      console.log(`🎫 Token: ${authToken.substring(0, 50)}...`);
    } else {
      console.log('❌ Login failed:', loginResult);
      console.log('💡 Try registering an author first or check credentials');
      return;
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Step 2: Get categories to use valid category_id
    console.log('📂 Step 2: Get categories...');
    const categoriesResponse = await fetch(`${BASE_URL}/categories`);
    const categories = await categoriesResponse.json();

    let categoryId = 1; // default
    if (categoriesResponse.ok && categories.length > 0) {
      categoryId = categories[0].id;
      console.log(`✅ Using category: ${categories[0].name} (ID: ${categoryId})`);
    } else {
      console.log('⚠️  No categories found, using default ID: 1');
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Step 3: Test POST with valid data
    console.log('📝 Step 3: Create new article...');
    const articleData = {
      title: 'Xu hướng phát triển Web 3.0 và Metaverse',
      summary: 'Khám phá những công nghệ tiên tiến đang định hình tương lai của internet và thế giới ảo',
      content: `
        <p>Web 3.0 và Metaverse đang trở thành những từ khóa hot nhất trong ngành công nghệ hiện nay. Đây không chỉ là xu hướng mà là cuộc cách mạng thực sự đang diễn ra.</p>
        
        <h2>Web 3.0 - Internet thế hệ mới</h2>
        <p>Web 3.0 được xây dựng trên nền tảng blockchain, mang lại:</p>
        <ul>
          <li><strong>Phân quyền:</strong> Không còn phụ thuộc vào các tập đoàn công nghệ lớn</li>
          <li><strong>Sở hữu dữ liệu:</strong> Người dùng kiểm soát hoàn toàn dữ liệu của mình</li>
          <li><strong>Tính minh bạch:</strong> Mọi giao dịch đều được ghi nhận trên blockchain</li>
          <li><strong>Khả năng tương tác:</strong> Các ứng dụng có thể kết nối với nhau dễ dàng</li>
        </ul>

        <h2>Metaverse - Thế giới ảo song song</h2>
        <p>Metaverse không chỉ là game mà là một hệ sinh thái số hoàn chỉnh:</p>
        <ol>
          <li><em>Kinh tế ảo:</em> Mua bán, kinh doanh trong thế giới số</li>
          <li><em>Xã hội ảo:</em> Tương tác, làm việc, giải trí trực tuyến</li>
          <li><em>Giáo dục ảo:</em> Học tập immersive với VR/AR</li>
          <li><em>Y tế ảo:</em> Chăm sóc sức khỏe từ xa</li>
        </ol>

        <h2>Thách thức và cơ hội</h2>
        <p><strong>Thách thức:</strong></p>
        <p>- Vấn đề bảo mật và quyền riêng tư<br>
        - Chi phí phát triển và duy trì cao<br>
        - Thiếu chuẩn chung giữa các nền tảng<br>
        - Khoảng cách số giữa các vùng miền</p>

        <p><strong>Cơ hội:</strong></p>
        <p>- Thị trường tiềm năng hàng nghìn tỷ USD<br>
        - Tạo ra nhiều việc làm mới<br>
        - Cải thiện trải nghiệm người dùng<br>
        - Kết nối toàn cầu không giới hạn</p>

        <h2>Kết luận</h2>
        <p>Web 3.0 và Metaverse đại diện cho tương lai của internet. Các doanh nghiệp và cá nhân cần chuẩn bị cho cuộc chuyển đổi này để không bị tụt lại phía sau. <strong>Đây là cơ hội vàng cho những ai dám tiên phong!</strong></p>
      `,
      image_url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=400&fit=crop',
      category_id: categoryId,
      priority: 8
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
      console.log('✅ Article created successfully!');
      console.log('📄 Created article:');
      console.log(`   ID: ${createResult.article.id}`);
      console.log(`   Title: "${createResult.article.title}"`);
      console.log(`   Slug: ${createResult.article.slug}`);
      console.log(`   Category: ${createResult.article.category}`);
      console.log(`   Author: ${createResult.article.author}`);
      console.log(`   Priority: ${createResult.article.priority}`);
    } else {
      console.log('❌ Article creation failed:', createResult);
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Step 4: Test error cases
    console.log('🚫 Step 4: Test error cases...');

    // Test missing required fields
    const invalidResponse = await fetch(`${BASE_URL}/articles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        title: '',
        content: '',
        // missing category_id
      })
    });

    const invalidResult = await invalidResponse.json();
    if (invalidResponse.status === 400) {
      console.log('✅ Validation working correctly');
      console.log(`🚫 ${invalidResult.error}`);
    }

    // Test invalid JSON
    const badJsonResponse = await fetch(`${BASE_URL}/articles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: 'invalid json{'
    });

    const badJsonResult = await badJsonResponse.json();
    if (badJsonResponse.status === 400) {
      console.log('✅ JSON validation working correctly');
      console.log(`🚫 ${badJsonResult.error}`);
    }

    console.log('\n🎉 POST Article API test completed!');

  } catch (error) {
    console.error('❌ Network error:', error.message);
    console.log('\n💡 Make sure your Next.js dev server is running: npm run dev');
    console.log('💡 Also ensure you have an author account in the database');
  }
}

// Run the test
testPostArticle();
