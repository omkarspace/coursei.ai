const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
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
          text: '```json\n{\n  "course": {\n    "name": "Python Programming Fundamentals",\n    "description": "This course provides a comprehensive introduction to Python programming for beginners. You\'ll learn the fundamental concepts of programming, including data types, variables, operators, control flow, and functions. By the end of this course, you will be able to write basic Python programs and solve simple programming problems.",\n    "chapters": [\n      {\n        "name": "Introduction to Python",\n        "about": "This chapter introduces the Python programming language, its history, and its applications. You\'ll also learn how to set up your development environment and write your first Python program.",\n        "duration": "1 hour"\n      },\n      {\n        "name": "Data Types and Variables",\n        "about": "This chapter explores the different data types in Python, including numbers, strings, booleans, and lists. You\'ll learn how to declare and assign variables, and how to perform basic operations on them.",\n        "duration": "1 hour"\n      },\n      {\n        "name": "Operators and Expressions",\n        "about": "This chapter introduces the various operators in Python, such as arithmetic, comparison, and logical operators. You\'ll learn how to use these operators to create complex expressions and evaluate them.",\n        "duration": "1 hour"\n      },\n      {\n        "name": "Control Flow Statements",\n        "about": "This chapter covers the core control flow statements in Python, including conditional statements (if-else) and loops (for, while). You\'ll learn how to control the flow of execution in your programs.",\n        "duration": "1 hour"\n      },\n      {\n        "name": "Functions and Modules",\n        "about": "This chapter introduces the concept of functions in Python. You\'ll learn how to define, call, and use functions to modularize your code and improve readability.",\n        "duration": "1 hour"\n      }\n    ],\n    "category": "Programming",\n    "topic": "Python",\n    "level": "Basic",\n    "duration": "5 hours",\n    "noOfChapters": 5\n  }\n}\n```',
        },
      ],
    },
  ],
});

// const result = await chatSession.sendMessage("INSERT_INPUT_HERE");
// console.log(result.response.text());
