# SlotSwapper Backend API

A robust Node.js backend for peer-to-peer time-slot scheduling with real-time notifications.

## 🚀 Features

- **RESTful API** with Express.js
- **MongoDB** for data persistence◊
- **Real-time notifications** with Socket.IO
- **Transaction support** for atomic swap operations
- **CORS enabled** for frontend integration
- **Comprehensive error handling**

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## 🔧 Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd slotswapper-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
Create a `.env` file in the root directory:
```env
MONGODB_URI=mongodb://localhost:27017/slotswapper
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
JWT_SECRET=your_jwt_secret_key_here
```

4. **Start MongoDB**
```bash
# On macOS with Homebrew
brew services start mongodb-community

# On Linux
sudo systemctl start mongod

# On Windows
net start MongoDB
```

5. **Run the server**
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

Server will start on `http://localhost:5000`


## 📡 API Endpoints

### Authentication

#### Register/Login User

- `POST /api/auth/login` - Login user
- `POST /api/auth/registration` - sign up user
- `GET /api/auth/me` - auth check

### Events (Calendar Slots)

- `GET /api/event/slot` - get user events
- `POST /api/event/slot` - create user new event
- `PUT /api/event/slot/:eventId/:userId/` - update user new event
- `DELETE /api/event/slot/:eventId` - delete user new event

### Swap Operations (Core Logic)

- `GET /api/event/slot/swappable` - Returns all SWAPPABLE slots from other users (excludes your own slots).
- `POST /api/event/slot/swap-request` - create new Swap request
- `GET /api/event/slot/swap-request/outgoing` - get user outgoing request
- `GET /api/event/slot/swap-request/incoming` - get user incoming request
- `DELETE /api/event/slot/swap-response/:requestId` - response for swap request



## 🏗️ Database Schema

### User
```javascript
{
  username: String (unique, required),
  email: String (optional),
  password:  String 
  createdAt: Date
}
```

### Event
```javascript
{
  userId: ObjectId (ref: User),
  title: String,
  date: String,
  startTime: String,
  endTime: String,
  status: 'BUSY' | 'SWAPPABLE' | 'SWAP_PENDING',
  createdAt: Date
}
```

### SwapRequest
```javascript
{
  fromUserId: ObjectId (ref: User),
  toUserId: ObjectId (ref: User),
  offerSlotId: ObjectId (ref: Event),
  requestSlotId: ObjectId (ref: Event),
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED',
  createdAt: Date,
  respondedAt: Date
}
```

### Notification
```javascript
{
  userId: ObjectId (ref: User),
  type: 'SWAP_REQUEST' | 'SWAP_ACCEPTED' | 'SWAP_REJECTED',
  message: String,
  swapRequestId: ObjectId (ref: SwapRequest),
  read: Boolean,
  createdAt: Date
}
```