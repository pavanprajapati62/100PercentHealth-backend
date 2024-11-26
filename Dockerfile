# Step 1: Use an official Node.js runtime as the base image
FROM node:18-alpine

# Step 2: Set the working directory inside the container
WORKDIR /usr/src/app

# Step 3: Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Step 4: Install project dependencies
RUN npm install

# Step 5: Copy the entire project directory to the container
COPY . .

# Step 6: Expose the application port (default for Express.js is 3000)
EXPOSE 3000

# Step 7: Start the application
CMD ["npm", "start"]
