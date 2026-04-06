# The Unread Archive

A digital sanctuary for timeless words. **The Unread Archive** is a clean, feature-rich web application built with Node.js, Express, MongoDB, and EJS designed for readers and writers.

## ✨ Features

- **Read & Explore:** Explore curated and community-driven stories, poems, and articles.
- **Write:** Share your own creative pieces directly onto the platform.
- **Archive System:** Fully searchable and filterable database of literary works.
- **Bookmarking:** Save your favorite articles for later.
- **Role-Based Access Control:** Distinct roles (`reader`, `writer`, `admin`) to protect administrative features.
- **Admin Dashboard:** Secure interface for admins to manage the book database.
- **Security First:** Implements Helmet headers, XSS prevention, NoSQL injection protection, and Rate Limiting.

## 🛠 Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Views Engine:** EJS
- **Security:** Helmet, express-rate-limit, xss-clean, express-mongo-sanitize
- **Authentication:** express-session, bcryptjs

## 🗂 Folder Structure

```
THE UNREAD ARCHIVE/
│
├── config/            # Database configuration
├── controllers/       # Route controllers (MVC)
├── middleware/        # Security, Auth, and Error handlers 
├── models/            # Mongoose Schemas (User, Article, Book)
├── public/            # Static assets (images, client JS)
├── routes/            # Express routing setup
├── views/             # EJS templates and layout components
├── .env.example       # Example environment variables
└── server.js          # Main application entry point
```

## 🚀 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repository_url>
   cd "THE UNREAD ARCHIVE"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Rename `.env.example` to `.env` and fill out your specific variables:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://127.0.0.1:27017/unreadArchive
   SESSION_SECRET=your_super_secret_key
   NODE_ENV=development
   ```

4. **Ensure MongoDB is running locally or provide a MongoDB Atlas URI.**

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   *For production, run `npm start`.*

6. **Visit in Browser:**
   Go to `http://localhost:3000`

## 🔒 Security Measures

- **Helmet:** Sets secure HTTP headers.
- **Rate Limit:** Prevents brute force/DDoS by capping requests per IP.
- **xss-clean & mongo-sanitize:** Prevents malicious script injections and NoSQL attacks through user inputs.
- **Session Security:** Strict Same-Site policy with HttpOnly flags enabled.

## 🔮 Future Improvements

- Add robust comment system for interaction.
- Add Rich Text Editor (like Quill.js) for writing articles.
- Implement pagination for the Archive feed to improve loading speeds for large DBs.

---
*Developed as part of a professional codebase enhancement.*
