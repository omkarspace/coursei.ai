const {
  GoogleGenerativeAI,
} = require("@google/generative-ai");

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

export const GenerateCourseLayout_AI = model.startChat({
  generationConfig,
  history: [
    {
      role: "user",
      parts: [
        {
          text: "Generate A Course Tutorial on Following\nDetail With field as Course Name,\nDescription, Along with Chapter Name,\nabout, Duration: Category: 'Programming',\nTopic: Python, Level:Basic, Duration:l hours,\nNOOf Chapters:5 , in JSON format I\n",
        },
      ],
    },
    {
      role: "model",
      parts: [
        {
          text: '```json\n{\n  "course": {\n    "name": "Python Programming Fundamentals",\n    "description": "This course provides a comprehensive introduction to Python programming for beginners.",\n    "chapters": [\n      {\n        "name": "Introduction to Python",\n        "about": "This chapter introduces the Python programming language.",\n        "duration": "1 hour"\n      },\n      {\n        "name": "Data Types and Variables",\n        "about": "This chapter explores the different data types in Python.",\n        "duration": "1 hour"\n      }\n    ]\n  }\n}\n```',
        },
      ],
    },
  ],
});

export const GenerateChapterContent_AI = model.startChat({
  generationConfig,
  history: [
    {
      role: "user",
      parts: [
        {
          text: "Explain the concept in Detail on Topic: golang, Chapter:Introduction to Go, in JSON Format with list of array with field as title, explanation on give chapter in details, Code Example( Code field in <precode> format) if applicable",
        },
      ],
    },
    {
      role: "model",
      parts: [
        {
          text: '```json\n[\n  {\n    "title": "Introduction to Go",\n    "explanation": "Go is a statically typed, compiled programming language designed at Google.",\n    "code": ""\n  }\n]\n```',
        },
      ],
    },
  ],
});

export const GenerateQuiz_AI = model.startChat({
  generationConfig,
  history: [
    {
      role: "user",
      parts: [
        {
          text: "Generate a quiz with 5 multiple choice questions based on the following chapter content. Return in JSON format with field as questions array containing question, options (array of 4 choices), correctAnswer (index 0-3), and explanation. Chapter: Variables in Python, Content: Variables are containers for storing data values.",
        },
      ],
    },
    {
      role: "model",
      parts: [
        {
          text: '```json\n{\n  "questions": [\n    {\n      "question": "What is a variable in Python?",\n      "options": ["A function", "A container for storing data", "A loop", "A condition"],\n      "correctAnswer": 1,\n      "explanation": "Variables are containers for storing data values in Python."\n    }\n  ]\n}\n```',
        },
      ],
    },
  ],
});

export const GenerateFlashcards_AI = model.startChat({
  generationConfig,
  history: [
    {
      role: "user",
      parts: [
        {
          text: "Generate 10 flashcards based on the following chapter content. Return in JSON format with field as cards array containing front (question/term) and back (answer/definition). Chapter: Python Basics, Content: Learn about variables, data types, and basic operations.",
        },
      ],
    },
    {
      role: "model",
      parts: [
        {
          text: '```json\n{\n  "cards": [\n    {\n      "front": "What is a variable?",\n      "back": "A named container that stores a value in memory."\n    },\n    {\n      "front": "What is an integer?",\n      "back": "A whole number without decimal points (e.g., 5, -3, 0)."\n    }\n  ]\n}\n```',
        },
      ],
    },
  ],
});

export const GenerateStudyNotes_AI = model.startChat({
  generationConfig,
  history: [
    {
      role: "user",
      parts: [
        {
          text: "Generate concise study notes for the following chapter. Return in JSON format with fields: summary (2-3 paragraph overview), keyPoints (array of 5-7 main takeaways), and importantTerms (array of objects with term and definition). Chapter: Introduction to Python, Content: Python is a high-level programming language known for its simplicity.",
        },
      ],
    },
    {
      role: "model",
      parts: [
        {
          text: '```json\n{\n  "summary": "Python is a high-level, interpreted programming language created by Guido van Rossum. It emphasizes code readability and supports multiple programming paradigms.",\n  "keyPoints": ["Python is interpreted, not compiled", "It uses indentation for code blocks", "Python supports multiple paradigms"],\n  "importantTerms": [\n    {"term": "Interpreter", "definition": "A program that executes code line by line"},\n    {"term": "High-level language", "definition": "A language that is human-readable and abstracts away hardware details"}\n  ]\n}\n```',
        },
      ],
    },
  ],
});
