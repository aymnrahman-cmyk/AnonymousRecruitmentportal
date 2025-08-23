# Anonymous Recruitment Platform

A modern web application that connects employers and jobseekers anonymously, eliminating bias in the hiring process. Built with Express.js, SQLite, and a clean HTML/CSS/JavaScript frontend.

## Features

### For Employers
- **Anonymous CV Browsing**: View jobseeker CVs without personal information
- **Swipe Interface**: Swipe right to connect, left to skip
- **Job Posting**: Create and manage job listings
- **Messaging**: Chat with matched candidates
- **Dashboard**: View statistics and recent activity

### For Jobseekers
- **Anonymous CV Creation**: Create CVs without revealing personal details
- **Job Browsing**: Browse available jobs with swipe interface
- **Job Applications**: Apply to jobs with one swipe
- **Messaging**: Chat with interested employers
- **Application Tracking**: Monitor application status

### Key Features
- **Anonymous Matching**: No names, photos, or personal details shown initially
- **Slide-based Information**: View different sections of CVs/jobs by tapping
- **Real-time Messaging**: Instant communication between matched users
- **Responsive Design**: Works on desktop and mobile devices
- **Secure Authentication**: JWT-based authentication with session management

## Technology Stack

- **Backend**: Express.js with Node.js
- **Database**: SQLite with SQLite3
- **Authentication**: JWT tokens with bcrypt password hashing
- **Frontend**: HTML5, CSS3 (Tailwind CSS), Vanilla JavaScript
- **Styling**: Tailwind CSS for modern, responsive design
- **Icons**: Font Awesome

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn package manager

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd anonymous-recruitment
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the environment file
   cp env.local.example env.local
   
   # Edit env.local with your configuration
   nano env.local
   ```

4. **Initialize the database**
   ```bash
   npm run init-db
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   Open your browser and navigate to `http://localhost:3000`

## Environment Configuration

Create an `env.local` file with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Secret (change this in production!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Database Configuration
DB_PATH=./database/recruitment.db

# Session Secret (change this in production!)
SESSION_SECRET=your-session-secret-key-change-this-in-production

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

## Database Schema

The application uses the following SQLite tables:

- **users**: User accounts and profiles
- **cvs**: Anonymous CVs for jobseekers
- **jobs**: Job postings by employers
- **applications**: Job applications
- **cv_swipes**: CV swipe history for employers
- **conversations**: Chat conversations between users
- **messages**: Individual messages in conversations

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### CV Management
- `POST /api/cv` - Create CV
- `GET /api/cv/my-cv` - Get user's CV
- `PUT /api/cv/my-cv` - Update CV
- `GET /api/cv/all` - Get all CVs (employers)
- `POST /api/cv/swipe` - Swipe CV

### Job Management
- `POST /api/jobs` - Create job
- `GET /api/jobs/all` - Get all jobs (jobseekers)
- `GET /api/jobs/my-jobs` - Get employer's jobs
- `POST /api/jobs/apply` - Apply to job
- `GET /api/jobs/:jobId/applications` - Get job applications
- `PUT /api/jobs/applications/:applicationId` - Update application status

### Chat System
- `GET /api/chat/conversations` - Get user conversations
- `GET /api/chat/conversations/:id/messages` - Get conversation messages
- `POST /api/chat/conversations/:id/messages` - Send message
- `PUT /api/chat/conversations/:id/messages/read` - Mark messages as read
- `GET /api/chat/unread-count` - Get unread message count

### User Dashboards
- `GET /api/employer/dashboard` - Employer dashboard data
- `GET /api/employer/profile` - Get employer profile
- `PUT /api/employer/profile` - Update employer profile
- `GET /api/jobseeker/dashboard` - Jobseeker dashboard data
- `GET /api/jobseeker/profile` - Get jobseeker profile
- `PUT /api/jobseeker/profile` - Update jobseeker profile
- `GET /api/jobseeker/applications` - Get jobseeker applications

## Usage Guide

### For Employers

1. **Registration**: Select "I am an Employer" and create an account
2. **Post Jobs**: Use the "+" button to create job listings
3. **Browse CVs**: Swipe through anonymous CVs
4. **Connect**: Swipe right on interesting candidates to start chatting
5. **Review Applications**: Check applications for your posted jobs

### For Jobseekers

1. **Registration**: Select "I am a Jobseeker" and create an account
2. **Create CV**: Build your anonymous CV with education, experience, and skills
3. **Browse Jobs**: Swipe through available job postings
4. **Apply**: Swipe right on jobs you're interested in
5. **Chat**: Communicate with employers who are interested in you

## Deployment

### Local Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Environment Variables for Production
Make sure to update the following in your production environment:
- `JWT_SECRET`: Use a strong, unique secret
- `SESSION_SECRET`: Use a strong, unique secret
- `NODE_ENV`: Set to "production"
- `CORS_ORIGIN`: Set to your production domain

### Database Backup
The SQLite database is stored in `./database/recruitment.db`. Make sure to:
- Regularly backup this file
- Set appropriate file permissions
- Consider using a more robust database for production (PostgreSQL, MySQL)

## Security Considerations

- All passwords are hashed using bcrypt
- JWT tokens are used for authentication
- Session management is implemented
- Input validation and sanitization
- CORS protection
- SQL injection prevention through parameterized queries

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.

## Roadmap

- [ ] Email notifications
- [ ] File uploads for CVs
- [ ] Advanced search and filtering
- [ ] Analytics dashboard
- [ ] Mobile app
- [ ] Video chat integration
- [ ] AI-powered matching
- [ ] Multi-language support 