<div align="center">
  <img src="./logo/logo.png" alt="SecretPromts Logo" width="120" height="120" />
  <h1>SecretPromts</h1>
  <p><strong>Save, organize, and manage your secret AI prompts — privately and securely.</strong></p>

  <p>
    <img src="https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=white" alt="React 19" />
    <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Vite-7.3-646CFF?logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-4.1-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black" alt="Firebase" />
    <img src="https://img.shields.io/badge/License-CC_BY--NC_4.0-lightgrey" alt="License" />
  </p>
</div>

---

## Overview

**SecretPromts** is a modern web application designed for AI enthusiasts, researchers, and professionals who want a secure space to store, categorize, and retrieve their AI prompts. Built with a sleek, responsive interface and real-time cloud sync via Firebase.

## Features

- **Secure Prompt Storage** — Save your prompts with Firebase backend
- **Organize & Categorize** — Tag and group prompts for easy retrieval
- **Fast Search** — Instantly find what you need
- **Clean UI** — Minimal, distraction-free interface built with Tailwind CSS
- **Responsive** — Works perfectly on desktop and mobile
- **Single-page App** — Compiled into a single file for optimal performance

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| **React 19.2** | UI framework |
| **TypeScript 5.9** | Type-safe development |
| **Vite 7.3** | Build tool & dev server |
| **Tailwind CSS 4.1** | Utility-first styling |
| **Firebase** | Backend & real-time database |
| **Lucide React** | Icon library |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/nRn-World/SecretPromts.git

# Navigate to the project directory
cd SecretPromts

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Build for Production

```bash
npm run build
```

The output will be a single optimized file in the `dist/` directory.

## Project Structure

```
SecretPromts/
├── src/
│   ├── components/    # Reusable UI components
│   ├── context/       # React context providers
│   ├── data/          # Data models and constants
│   ├── firebase/      # Firebase configuration and services
│   ├── utils/         # Helper functions
│   ├── App.tsx        # Root application component
│   ├── main.tsx       # Application entry point
│   └── index.css      # Global styles
├── logo/              # Logo assets
├── dist/              # Production build output
├── index.html         # HTML entry point
├── package.json       # Dependencies and scripts
├── tsconfig.json      # TypeScript configuration
└── vite.config.ts     # Vite configuration
```

## License

This project is licensed under the **Creative Commons Attribution-NonCommercial 4.0 International Public License**.

See the [LICENSE](./LICENSE) file for full details.

---

<div align="center">
  <p>Built with ❤️ by <a href="https://github.com/nRn-World">nRn World</a></p>
  <p>Copyright &copy; 2026 SecretPromts</p>
</div>
