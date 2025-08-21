// 火山引擎 API 配置文件
// 请将以下配置替换为你的实际火山引擎 API 信息

window.VOLCENGINE_CONFIG = {
  // 火山引擎 API 密钥 - 请替换为你的实际密钥
  accessKey: 'c2654a44-8350-4baf-a1cf-1052f6497554',
  secretKey: 'YOUR_SECRET_KEY_HERE', // 需要替换为实际的secretKey
  
  // 使用本地代理服务器以避免浏览器CORS限制（需先运行 server.py 或启动脚本）
  // 原直连端点: https://ark.cn-beijing.volces.com
  apiEndpoint: 'http://localhost:8000/api/proxy',
  
  // 图片生成模型配置
  imageModel: 'doubao-seedream-3-0-t2i-250415',
  imageConfig: {
    width: 1024,
    height: 1024,
    guidance_scale: 7.5,
    num_inference_steps: 20,
    watermark: false,
    negative_prompt: '恐怖，暴力，成人内容，低质量，模糊，不适合儿童，黑暗，血腥'
  },
  
  // 文本生成模型配置
  textModel: 'doubao-seed-1-6-250615',
  textConfig: {
    max_tokens: 200,
    temperature: 0.7,
    top_p: 0.9
  }
};

// 使用说明：
// 1. 登录火山引擎控制台：https://console.volcengine.com/
// 2. 创建 API 密钥，获取 accessKey 和 secretKey
// 3. 将上述配置中的 YOUR_SECRET_KEY_HERE 替换为实际的 secretKey
// 4. 确保已开通相应的 AI 服务（doubao-seedream-3-0-t2i-250415 和 doubao-seed-1-6-250615 模型）
// 5. 如果遇到CORS问题，请使用 config-proxy.js 配置并启动本地服务器
