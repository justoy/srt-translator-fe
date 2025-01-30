# SRT Translator

A web application for translating SRT subtitle files using LLM AI, e.g., OpenAI gpt-4o-mini. Built with Next.js and TypeScript, this tool helps you easily translate subtitle files while preserving their timing and formatting.

## Features

- 📝 Parse and process SRT subtitle files
- 🌐 Translate subtitle content while maintaining timing information
- ⚡ Efficient batch processing for large subtitle files
- 🎯 Preserves original SRT formatting and structure
- 💻 Modern web interface built with React and Tailwind CSS

## Getting Started

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to use the application

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## Project Structure

```
app/
├── utils/
│   ├── srtUtils.ts      # SRT parsing and formatting utilities
│   └── translationProviders.ts  # Translation service integrations
├── types/
│   └── *.d.ts          # TypeScript type definitions
└── page.tsx            # Main application page
```

## Deployment

This is a Next.js application that can be deployed to any platform that supports Node.js. For the easiest deployment experience, use [Vercel](https://vercel.com), the platform created by the makers of Next.js.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
