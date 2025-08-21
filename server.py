#!/usr/bin/env python3
"""
简单的本地服务器，用于解决CORS问题
运行方式: python server.py
"""

import http.server
import socketserver
import os
import sys
from urllib.parse import urlparse, parse_qs
import json
import requests

# 配置
PORT = 8000
VOLCENGINE_CONFIG = {
    'apiEndpoint': 'https://ark.cn-beijing.volces.com',
    'accessKey': 'c2654a44-8350-4baf-a1cf-1052f6497554'
}

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # 添加CORS头
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()
    
    def do_OPTIONS(self):
        # 处理预检请求
        self.send_response(200)
        self.end_headers()
    
    def do_POST(self):
        if self.path.startswith('/api/proxy/'):
            self.handle_api_proxy()
        else:
            super().do_POST()
    
    def handle_api_proxy(self):
        """处理API代理请求"""
        try:
            # 获取请求体
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            # 解析目标API路径
            target_path = self.path.replace('/api/proxy/', '')
            
            # 构建目标URL
            target_url = f"{VOLCENGINE_CONFIG['apiEndpoint']}/{target_path}"
            
            # 转发请求到火山引擎
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f"Bearer {VOLCENGINE_CONFIG['accessKey']}"
            }
            
            print(f"代理请求: {target_url}")
            print(f"请求头: {headers}")
            print(f"请求体: {post_data.decode()}")
            
            response = requests.post(
                target_url,
                headers=headers,
                data=post_data,
                timeout=30
            )
            
            # 返回响应
            self.send_response(response.status_code)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(response.content)
            
            print(f"响应状态: {response.status_code}")
            print(f"响应内容: {response.text}")
            
        except Exception as e:
            print(f"代理请求失败: {e}")
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            error_response = {
                'error': '代理请求失败',
                'message': str(e)
            }
            self.wfile.write(json.dumps(error_response).encode())

def main():
    # 切换到脚本所在目录
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    print(f"启动本地服务器在端口 {PORT}")
    print(f"访问地址: http://localhost:{PORT}")
    print(f"调试工具: http://localhost:{PORT}/debug-proxy.html")
    print(f"主应用: http://localhost:{PORT}/index.html")
    print("\n按 Ctrl+C 停止服务器")
    
    try:
        with socketserver.TCPServer(("", PORT), CORSHTTPRequestHandler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n服务器已停止")
    except Exception as e:
        print(f"服务器启动失败: {e}")

if __name__ == "__main__":
    main()

