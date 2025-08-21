const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');

// 配置
const PORT = 8000;
const VOLCENGINE_CONFIG = {
    'apiEndpoint': 'https://ark.cn-beijing.volces.com',
    'accessKey': 'c2654a44-8350-4baf-a1cf-1052f6497554'
};

// 创建HTTP服务器
const server = http.createServer((req, res) => {
    console.log(`收到请求: ${req.method} ${req.url}`);
    
    // 添加CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // 处理预检请求
    if (req.method === 'OPTIONS') {
        console.log('处理OPTIONS预检请求');
        res.writeHead(200);
        res.end();
        return;
    }
    
    // 处理API代理请求
    if (req.url && req.url.startsWith('/api/proxy/')) {
        console.log('处理API代理请求:', req.url);
        handleApiProxy(req, res);
        return;
    }
    
    // 处理静态文件
    console.log('处理静态文件请求:', req.url);
    handleStaticFile(req, res);
});

function handleApiProxy(req, res) {
    try {
        // 解析目标API路径
        const targetPath = req.url.replace('/api/proxy/', '');
        
        // 构建目标URL
        const targetUrl = `${VOLCENGINE_CONFIG.apiEndpoint}/${targetPath}`;
        
        console.log(`代理请求: ${targetUrl}`);
        console.log(`请求方法: ${req.method}`);
        
        // 收集请求体
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            // 转发请求到火山引擎
            const options = {
                hostname: 'ark.cn-beijing.volces.com',
                port: 443,
                path: `/${targetPath}`,
                method: req.method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${VOLCENGINE_CONFIG.accessKey}`,
                    'Content-Length': Buffer.byteLength(body)
                }
            };
            
            console.log(`请求头:`, options.headers);
            console.log(`请求体: ${body}`);
            
            const proxyReq = https.request(options, (proxyRes) => {
                console.log(`响应状态: ${proxyRes.statusCode}`);
                
                // 设置响应头
                res.writeHead(proxyRes.statusCode, {
                    'Content-Type': 'application/json'
                });
                
                // 转发响应体
                proxyRes.pipe(res);
                
                // 收集响应数据用于日志
                let responseData = '';
                proxyRes.on('data', chunk => {
                    responseData += chunk.toString();
                });
                
                proxyRes.on('end', () => {
                    console.log(`响应内容: ${responseData}`);
                });
            });
            
            proxyReq.on('error', (error) => {
                console.error(`代理请求失败: ${error.message}`);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    error: '代理请求失败',
                    message: error.message
                }));
            });
            
            // 发送请求体
            if (body) {
                proxyReq.write(body);
            }
            proxyReq.end();
        });
        
    } catch (error) {
        console.error(`代理请求处理失败: ${error.message}`);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            error: '代理请求处理失败',
            message: error.message
        }));
    }
}

function handleStaticFile(req, res) {
    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = path.join(__dirname, filePath);
    
    // 安全检查：确保文件路径在项目目录内
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(__dirname)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Internal server error');
            }
            return;
        }
        
        // 根据文件扩展名设置Content-Type
        const ext = path.extname(filePath);
        const contentType = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml'
        }[ext] || 'text/plain';
        
        res.setHeader('Content-Type', contentType);
        res.end(data);
    });
}

// 启动服务器
server.listen(PORT, () => {
    console.log(`启动本地服务器在端口 ${PORT}`);
    console.log(`访问地址: http://localhost:${PORT}`);
    console.log(`调试工具: http://localhost:${PORT}/debug-proxy.html`);
    console.log(`主应用: http://localhost:${PORT}/index.html`);
    console.log('\n按 Ctrl+C 停止服务器');
});

// 处理服务器错误
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`端口 ${PORT} 已被占用，请尝试其他端口或关闭占用该端口的程序`);
    } else {
        console.error(`服务器错误: ${error.message}`);
    }
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n服务器正在关闭...');
    server.close(() => {
        console.log('服务器已停止');
        process.exit(0);
    });
});
