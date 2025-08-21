// 使用本地代理的火山引擎 API 配置文件
// 需要先运行 python server.py 启动本地服务器

window.VOLCENGINE_CONFIG = {
  // 火山引擎 API 密钥
  accessKey: 'c2654a44-8350-4baf-a1cf-1052f6497554',
  secretKey: 'YOUR_SECRET_KEY_HERE',
  
  // 使用本地代理服务器
  apiEndpoint: 'http://localhost:8000/api/proxy',
  
  // 图片生成模型配置
  imageModel: 'doubao-seedream-3-0-t2i-250415',
  imageConfig: {
    width: 1024,
    height: 1024,
    guidance_scale: 3,
    watermark: true,
    negative_prompt: '恐怖，暴力，成人内容，低质量，模糊，不适合儿童'
  },
  
  // 文本生成模型配置
  textModel: 'doubao-seed-1-6-250615',
  textConfig: {
    max_tokens: 200,
    temperature: 0.7
  }
};

// 使用说明：
// 1. 确保已安装 Python 和 requests 库: pip install requests
// 2. 运行本地服务器: python server.py
// 3. 在浏览器中访问: http://localhost:8000/debug.html
// 4. 使用此配置文件替换 config.js

