# Meeting Scheduling App Backend

This is the backend service for the Meeting Scheduling App. It provides APIs for managing meetings, users, and schedules.

## Features

- User authentication and authorization
- Create, update, and delete meetings
- Manage user schedules
- Send notifications for upcoming meetings

## Technologies Used

- Node.js
- Express.js
- MongoDB
- JWT for authentication

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB

### Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/kavishkakalhara1/meeting-scheduling-app-backend.git
    ```
2. Navigate to the project directory:
    ```bash
    cd meeting-scheduling-app-backend
    ```
3. Install dependencies:
    ```bash
    npm install
    ```

### Configuration

1. Create a `.env` file in the root directory and add the following environment variables:
    ```env
    PORT=3000
    MONGODB_URI=mongodb://localhost:27017/meeting-scheduler
    JWT_SECRET=your_jwt_secret
    ```

### Running the Application

1. Start the MongoDB server:
    ```bash
    mongod
    ```
2. Start the application:
    ```bash
    npm start
    ```
3. The server will be running at `http://localhost:3000`.

## API Documentation

The API documentation is available at `http://localhost:3000/api-docs` once the server is running.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License.