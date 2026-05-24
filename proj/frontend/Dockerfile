FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

# Using the flag we added earlier to bypass peer dependency issues
RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]