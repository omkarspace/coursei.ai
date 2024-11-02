
# 🚀 Full Stack AI Course Generator App

Welcome to the **Full Stack AI Course Generator**! This app leverages powerful technologies like **Next.js**, **React**, **Tailwind CSS**, **Drizzle ORM**, and the **Gemini API** to dynamically generate customized courses powered by AI. Ideal for developers and educators looking to create and manage interactive course content. 

## 📋 Table of Contents
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Running the App](#-running-the-app)
- [Project Structure](#-project-structure)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features
- **AI-Powered Content Generation**: Uses the Gemini API to dynamically generate course content.
- **Customizable Modules**: Adjust course modules, topics, and content to suit different learning paths.
- **Responsive Design**: Built with Tailwind CSS for a seamless experience on any device.
- **Full Stack**: Integrates front-end, back-end, and database layers using Drizzle ORM and Next.js API routes.
- **Deployable on Vercel**: Optimized for deployment on Vercel with Next.js serverless functions.

## 🛠️ Tech Stack
- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Next.js API Routes, Gemini API (for AI functionality)
- **Database**: Drizzle ORM (with SQL or SQLite as per preference)
- **Deployment**: Vercel (optional)

---

## 🚀 Getting Started
Follow these steps to set up the project locally.

### Prerequisites
- **Node.js** (v16 or later)
- **Yarn** or **npm**
- **Git**

### Installation
1. **Clone the repo**:
   ```bash
   git clone https://github.com/your-username/ai-course-generator.git
   cd ai-course-generator
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```
   or if you use Yarn:
   ```bash
   yarn install
   ```

3. **Set up environment variables** (see [Environment Variables](#-environment-variables)).

---

## 🔐 Environment Variables
Create a `.env.local` file in the root directory and add the following:

```plaintext
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
DATABASE_URL=your_database_url
```

Replace `your_gemini_api_key` and `your_database_url` with your actual API key and database connection string.

---

## ▶️ Running the App

- **Development**:
  ```bash
  npm run dev
  ```
  or with Yarn:
  ```bash
  yarn dev
  ```
- **Build for Production**:
  ```bash
  npm run build
  npm start
  ```
  
Access the app at [http://localhost:3000](http://localhost:3000).

---

## 📂 Project Structure
Here's an overview of the project structure:

```plaintext
.
├── components     # Reusable UI components
├── pages          # Next.js pages and API routes
│   ├── api        # Backend API routes for course generation
│   └── index.js   # Homepage
├── styles         # Global and component-specific styles
├── utils          # Utility functions and helpers
├── db             # Database configuration (Drizzle ORM)
├── public         # Static assets
└── README.md      # Project documentation
```

---

## 📸 Screenshots
| Home Page | Course Module |
|-----------|---------------|
| ![Home Page](./screenshots/homepage.png) | ![Course Module](./screenshots/module.png) |

> Add screenshots in the `./screenshots` directory.

---

## 🤝 Contributing
We welcome contributions! Here’s how you can help:

1. **Fork** the repository.
2. **Create** a new branch (`feature/YourFeature`).
3. **Commit** your changes (`git commit -m 'Add a cool feature'`).
4. **Push** to the branch (`git push origin feature/YourFeature`).
5. **Open** a Pull Request.

---

## 📝 License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments
- [Gemini API](https://geminiapi.com) for AI-based content generation.
- The open-source community for inspiration and code snippets.

---

Happy Coding! 🎉
