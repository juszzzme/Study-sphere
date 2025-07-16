# Study Sphere 🎓

A comprehensive study platform designed to enhance learning efficiency through gamification, real-time collaboration, and intelligent resource management.

## 🌟 Features

### 📚 Core Learning Tools
- **Resource Hub**: Upload, organize, and share study materials
- **Interactive Calendar**: Schedule and track study sessions
- **Pomodoro Timer**: Built-in focus timer with customizable intervals
- **Real-time Chat**: Collaborate with study groups instantly

### 🎮 Gamification System
- **XP Points**: Earn experience for study activities
- **Achievement Badges**: Unlock rewards for milestones
- **Study Streaks**: Maintain consistent learning habits
- **Leaderboards**: Compete with peers (coming soon)

### 🔧 Additional Features
- **Whiteboard**: Visual collaboration tool
- **SwipeMaster**: Interactive flashcard system
- **Dark/Light Mode**: Customizable interface
- **Responsive Design**: Works on all devices

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/study-sphere.git
   cd study-sphere
   ```

2. **Backend Setup**
   ```bash
   cd Backend
   npm install
   
   # Create environment file
   cp .env.example .env
   # Edit .env with your MongoDB URI and other settings
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Database Setup**
   - Ensure MongoDB is running locally on port 27017
   - Or update `MONGO_URI` in `.env` with your MongoDB connection string

### Running the Application

1. **Start the Backend Server**
   ```bash
   cd Backend
   npm run zaheer  # Development mode with nodemon
   # or
   npm start      # Production mode
   ```
   Server will run on `http://localhost:5006`

2. **Start the Frontend**
   ```bash
   cd frontend
   npm start
   ```
   Application will open at `http://localhost:3000`

## 📁 Project Structure

```
study-sphere/
├── Backend/                 # Node.js/Express server
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API endpoints
│   ├── middleware/         # Custom middleware
│   ├── uploads/           # File storage
│   ├── server.js          # Main server file
│   └── package.json       # Backend dependencies
├── frontend/               # React application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Main application pages
│   │   ├── hooks/         # Custom React hooks
│   │   ├── utils/         # Utility functions
│   │   └── config.js      # App configuration
│   ├── public/            # Static assets
│   └── package.json       # Frontend dependencies
└── README.md              # Project documentation
```

## 🔧 Configuration

### Backend Configuration (`.env`)
```env
MONGO_URI=mongodb://localhost:27017/study_sphere
PORT=5006
NODE_ENV=development
JWT_SECRET=your_secure_secret_key_here
FRONTEND_URL=http://localhost:3000
```

### Frontend Configuration (`src/config.js`)
- API endpoints
- Feature flags
- Gamification settings
- Pomodoro timer defaults

## 📚 API Documentation

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Resources
- `GET /api/resources` - Fetch all resources
- `POST /api/resources` - Upload new resource
- `DELETE /api/resources/:id` - Delete resource

### Chat
- `GET /api/chat/messages` - Fetch chat messages
- `POST /api/chat/messages` - Send message

### Gamification
- `GET /api/gamification/stats` - User statistics
- `POST /api/gamification/activity` - Log activity

## 🎯 Usage Examples

### Starting a Study Session
1. Navigate to the Pomodoro Timer
2. Set your desired work/break intervals
3. Click "Start Session"
4. Earn XP points automatically!

### Sharing Resources
1. Go to Resource Hub
2. Click "Upload Resource"
3. Fill in details and select file
4. Share with your study group

### Real-time Collaboration
1. Join a chat room
2. Use the integrated whiteboard
3. Share screens and notes instantly

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## 🐛 Bug Reports

Found a bug? Please create an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- React team for the amazing framework
- MongoDB for reliable data storage
- Socket.IO for real-time functionality
- All contributors and testers

## 📞 Support

- Email: support@studysphere.edu
- GitHub Issues: [Create an issue](https://github.com/YOUR_USERNAME/study-sphere/issues)
- Documentation: [Wiki](https://github.com/YOUR_USERNAME/study-sphere/wiki)

---

**Made with ❤️ by the Study Sphere Team**

*Empowering students to achieve their academic goals through technology*
