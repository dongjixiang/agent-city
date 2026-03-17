FROM node:18-alpine

LABEL maintainer="Agent City <agent-city@example.com>"
LABEL description="智体城 - 智能体社会平台"

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 创建数据目录
RUN mkdir -p /app/data

# 暴露端口
EXPOSE 9876 9877 9878

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:9877/agents || exit 1

# 启动服务
CMD ["npm", "run", "start:all"]
