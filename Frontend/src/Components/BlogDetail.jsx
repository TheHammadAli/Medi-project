import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

const BlogDetail = () => {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/blogs/${id}`);
        setBlog(res.data.blog);
      } catch (err) {
        console.error("Failed to load blog", err);
      }
    };
    fetchBlog();
  }, [id]);

  if (!blog)
    return (
      <div className="p-6 text-center text-gray-500 font-medium">
        Loading blog...
      </div>
    );

  return (
    <div className="w-full bg-gray-100 py-12 px-4 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden transition-all duration-300">
        
        {/* Banner Image with Blue Gradient */}
        <div className="relative w-full h-64 sm:h-80 md:h-96 overflow-hidden">
          <img
            src={blog.bannerImage}
            alt={blog.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-blue-900/70 to-transparent flex items-end p-6">
            <h1 className="text-white text-2xl sm:text-3xl font-bold drop-shadow-lg">
              {blog.title}
            </h1>
          </div>
        </div>

        {/* Author Info & Date */}
        <div className="px-6 py-5 bg-blue-50 border-b border-gray-200">
          <p className="text-center text-sm text-gray-700">
            By{" "}
            <span className="text-blue-700 font-semibold">
            {`Dr. ${blog.doctorId?.username || "Unknown Doctor"}`}
            </span>{" "}
            | {new Date(blog.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Blog Content */}
        <div className="px-6 py-8">
          <div
            className="prose sm:prose-lg max-w-none text-gray-800 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />
        </div>

        {/* Back Button */}
        <div className="px-6 pb-8 text-center">
          <Link
            to="/all-blogs"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
          >
            ← Back to Blogs
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BlogDetail;
