import React from "react";
import YouTube from "react-youtube";
import ReactMarkdown from "react-markdown";

// Video player options
const opts = {
  height: "390",
  width: "640",
  playerVars: {
    autoplay: 0,
  },
};

function ChapterContent({ chapter, content }) {
  return (
    <div className="container mx-auto p-6">
      <h2 className="font-semibold text-3xl sm:text-4xl text-gray-800">{chapter?.name}</h2>
      <p className="text-gray-600 text-lg">{chapter?.about}</p>

      {/* YouTube Video Embed with Responsive Design */}
      <div className="my-8">
        <div className="relative pb-9/16 pt-5 overflow-hidden h-0 rounded-lg bg-black">
          <YouTube
            videoId={content?.videoId}
            opts={opts}
            className="absolute top-0 left-0 w-full h-full"
          />
        </div>
      </div>

      {/* Content Block */}
      <div>
        {Array.isArray(content?.content) ? (
          content.content.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md mb-6 p-6 hover:shadow-xl transition-all"
            >
              <h3 className="font-medium text-xl text-gray-800">{item?.title}</h3>
              <ReactMarkdown className="prose max-w-full text-gray-700">{item?.explanation}</ReactMarkdown>
              
              {/* Code Snippet */}
              {item.code && (
                <div className="mt-6 bg-gray-800 text-white p-4 rounded-md relative overflow-auto">
                  <pre className="whitespace-pre-wrap">{item?.code}</pre>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-center text-lg text-gray-500">No content available</p>
        )}
      </div>
    </div>
  );
}

export default ChapterContent;
