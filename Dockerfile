FROM node:22-alpine

# Create app directory
WORKDIR /app

# Copy only required files
COPY package.json ./
COPY index.js ./

# Use non-root user for security
USER node

EXPOSE 3000

# Run node
CMD ["node", "index.js"]