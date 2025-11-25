import React, { createContext, useContext, useState } from "react";
import axios from "axios";
import { toast } from "sonner";

const BlogContext = createContext();

export const BlogProvider = ({ children }) => {
  const [blogs, setBlogs] = useState([]);

  // ✅ Upload blog
  const uploadBlog = async (formData) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:8000/api/blogs/upload",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("Blog uploaded successfully!");
      setBlogs((prev) => [res.data.blog, ...prev]);
      return { success: true, blog: res.data.blog };
    } catch (err) {
      console.error("Upload failed:", err);
      toast.error("Failed to upload blog");
      return { success: false };
    }
  };

  // ✅ Fetch all blogs
  const fetchAllBlogs = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/blogs");
      setBlogs(res.data.blogs);
    } catch (err) {
      toast.error("Failed to fetch blogs");
      console.error(err);
    }
  };

  return (
    <BlogContext.Provider value={{ blogs, setBlogs, uploadBlog, fetchAllBlogs }}>
      {children}
    </BlogContext.Provider>
  );
};

export const useBlogContext = () => useContext(BlogContext);
