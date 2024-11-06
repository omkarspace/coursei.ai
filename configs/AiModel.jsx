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
          text: '```json\n[\n  {\n    "title": "Introduction to Go",\n    "explanation": "Go, often referred to as Golang, is a statically typed, compiled programming language designed at Google by Robert Griesemer, Rob Pike, and Ken Thompson. It is known for its simplicity, efficiency, and concurrency features. Go was created to address the challenges faced by large software development teams working on complex projects, focusing on readability, maintainability, and performance.",\n    "code": ""\n  },\n  {\n    "title": "Key Features of Go",\n    "explanation": "Go is characterized by a set of key features that make it a compelling choice for a wide range of applications:",\n    "code": ""\n  },\n  {\n    "title": "Simplicity and Readability",\n    "explanation": "Go\'s syntax is deliberately minimalistic, making it easy to learn and read. It emphasizes clarity and avoids unnecessary complexity.",\n    "code": ""\n  },\n  {\n    "title": "Static Typing",\n    "explanation": "Go is statically typed, meaning data types are checked at compile time, helping catch errors early in the development process. This improves code quality and reliability.",\n    "code": ""\n  },\n  {\n    "title": "Concurrency",\n    "explanation": "Go excels in handling concurrency through its lightweight goroutines and channels. This allows developers to write code that can efficiently utilize multiple cores and handle many concurrent tasks.",\n    "code": ""\n  },\n  {\n    "title": "Garbage Collection",\n    "explanation": "Go incorporates automatic garbage collection, relieving developers from the burden of manual memory management. This simplifies memory handling and prevents common memory leaks.",\n    "code": ""\n  },\n  {\n    "title": "Built-in Support for Networking",\n    "explanation": "Go provides powerful and easy-to-use libraries for networking, making it well-suited for developing network-intensive applications.",\n    "code": ""\n  },\n  {\n    "title": "Cross-Platform Compatibility",\n    "explanation": "Go compiles to native machine code, enabling it to run on a wide range of platforms without requiring platform-specific modifications.",\n    "code": ""\n  },\n  {\n    "title": "Standard Library",\n    "explanation": "Go comes with a comprehensive standard library that offers a rich set of functionalities for various tasks, reducing the need for external dependencies.",\n    "code": ""\n  },\n  {\n    "title": "Example Go Program",\n    "explanation": "This basic example demonstrates a simple "Hello, World!" program in Go:",\n    "code": "<precode>package main\n\nimport \\"fmt\\"\n\nfunc main() {\n  fmt.Println(\\"Hello, World!\\")\n}\n</precode>"\n  },\n  {\n    "title": "Compiling and Running Go Programs",\n    "explanation": "After writing a Go program, you need to compile and run it. Go provides a command-line tool called `go` for this purpose.",\n    "code": ""\n  },\n  {\n    "title": "Getting Started with Go",\n    "explanation": "To begin using Go, you need to install it on your system. The official Go website (https://golang.org/) provides detailed installation instructions for various operating systems.",\n    "code": ""\n  }\n]\n```',
        },
      ],
    },
  ],
});

// const result = await chatSession.sendMessage("INSERT_INPUT_HERE");
// console.log(result.response.text());
