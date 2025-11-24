# 1. Base image
FROM node:20 AS base
WORKDIR /app

# 2. Install dependencies
# Copy package manifests first for layer caching
COPY package*.json ./
RUN npm install

# 3. Generate Prisma client
# Copy your Prisma schema into the image
COPY prisma ./prisma
# If you use environment variables in your schema (e.g. DATABASE_URL),
# you can pass a dummy here or use build args; Prisma Generate does NOT need a real DB.
RUN npx prisma generate

# 4. Copy the rest of your source code
COPY . .

# 5. Expose port (if you have HTTP endpoints)
EXPOSE 3000

# 6. Entrypoint: run migrations (optional) then start your indexer
#    We use a shell so we can chain commands
CMD ["sh", "-c", " npm run indexer"]

