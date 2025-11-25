import React, { useEffect } from "react";
import { useBlogContext } from "../Context/BlogContext";
import { Link } from "react-router-dom";
import SlideInOnScroll from "./SlideInOnScroll";
import { FaArrowRight } from "react-icons/fa";

const AllBlogs = () => {
  const { blogs, fetchAllBlogs } = useBlogContext();

  useEffect(() => {
    fetchAllBlogs();
  }, []);

  return (
    <div className="overflow-x-hidden">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <SlideInOnScroll direction="up">
              <h1 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                Latest Blogs
              </h1>
              <p className="text-xl md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Real insights and helpful tips from verified doctors.
              </p>
            </SlideInOnScroll>
          </div>
        </div>
      </section>

      {/* Blogs Section */}
      <section className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {blogs.length === 0 ? (
            <div className="text-center">
              <SlideInOnScroll direction="up">
                <p className="text-xl text-gray-500">No blogs found.</p>
              </SlideInOnScroll>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogs.map((blog, index) => (
                <SlideInOnScroll key={blog._id} direction={index % 2 === 0 ? "up" : "up"}>
                  <Link
                    to={`/blogs/${blog._id}`}
                    className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 overflow-hidden"
                  >
                    <div className="relative">
                      <img
                        src={blog.bannerImage}
                        alt={blog.title}
                        className="w-full h-48 object-cover transition duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors duration-300">
                        {blog.title}
                      </h3>
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                        <span>{`Dr. ${blog.doctorId?.username || "Unknown Doctor"}`}</span>
                        <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-gray-500">5 minute read</p>
                      <div className="mt-4 flex items-center text-blue-600 font-semibold group-hover:translate-x-1 transition-transform duration-300">
                        Read More
                        <FaArrowRight className="ml-2" />
                      </div>
                    </div>
                  </Link>
                </SlideInOnScroll>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AllBlogs;
