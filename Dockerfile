# ── Use a slim Node base for small image size
FROM node:20-bullseye-slim

# ── Install Chromium and its dependencies
RUN apt-get update \
 && apt-get install -y \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
 && rm -rf /var/lib/apt/lists/*

# ── App directory
WORKDIR /app

# ── Install dependencies
COPY package*.json ./
RUN npm install --production

# ── Copy source
COPY . .

# ── Tell Puppeteer to use the system Chromium (but allow fallback)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# ── Expose the port your Express app listens on
EXPOSE 3000

# ── Start the service
CMD ["node", "render-service.js"]
