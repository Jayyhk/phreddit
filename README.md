# Phreddit - A Reddit-inspired Web Application

Phreddit is a full-stack web application inspired by Reddit, built using MongoDB, Express, React, and Node.js.

## Project Structure

```
project-s25-dvd/
├── client/               # React frontend
│   ├── public/           # Static files
│   ├── src/              # React source code
│   │   ├── components/   # React components
│   │   ├── stylesheets/  # CSS styles
│   │   ├── App.js        # Main application component
│   │   ├── axios.js      # Axios configuration
│   │   └── index.js      # Entry point
│   ├── react.test.js     # React component tests
│   ├── babel.config.js   # Babel configuration
│   ├── jest.config.js    # Jest configuration
│   └── package.json      # Frontend dependencies
├── server/               # Node.js backend
│   ├── models/           # MongoDB models
│   ├── api.js            # API routes and handlers
│   ├── server.js         # Main server file
│   ├── init.js           # Database initialization
│   ├── mongoDB.test.js   # Database tests
│   ├── express.test.js   # API tests
│   ├── eslint.config.mjs # ESLint configuration
│   └── package.json      # Backend dependencies
├── images/               # UML diagrams and other images
├── .gitignore            # Git ignore rules
└── README.md             # This file
```

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v18 or higher)
- MongoDB (v6.0 or higher)
- npm (v9 or higher)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/Jayyhk/phreddit.git
cd phreddit
```

### 2. Install Dependencies

#### Server Setup

```bash
cd server
npm install
```

#### Client Setup

```bash
cd ../client
npm install
```

### 3. MongoDB Setup

1. Start MongoDB:

```bash
mongod
```

2. In a new terminal from the repo root, initialize the database with an admin user.

```bash
node server/init.js admin@admin.com "Admin" "admin123"
```

- This will also populate the database with test data.

### 4. Running the Application

1. Start the server (from the server directory):

```bash
cd server
npm start
```

The server will run on http://localhost:8000

2. In a new terminal from the repo root, start the client (from the client directory):

```bash
cd client
npm start
```

The client will run on http://localhost:3000.

## Testing with Jest

### Server Tests

```bash
cd server
npm test
```

### Client Tests

```bash
cd client
npm test
```

## UML Diagrams

The class, sequence, and state diagrams can be found in `images/`.
