const Blog = require("../Model/Blog");
const cloudinary = require("../Config/cloudinary");

const uploadBlog = async (req, res) => {
  try {
    const { title, content } = req.body;
    const doctorId = req.user._id;

    if (!req.file || !req.file.buffer) {
      return res
        .status(400)
        .json({ success: false, message: "Image file is required." });
    }

    const stream = cloudinary.uploader.upload_stream(
      { folder: "blogs", resource_type: "image" },
      async (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return res
            .status(500)
            .json({ success: false, message: "Cloudinary upload failed." });
        }

        const newBlog = new Blog({
          doctorId,
          title,
          bannerImage: result.secure_url,
          content,
        });

        const saved = await newBlog.save();
        res.status(201).json({ success: true, blog: saved });
      }
    );

    stream.end(req.file.buffer);
  } catch (error) {
    console.error("Blog Upload Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
const getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find()
      .populate("doctorId", "username")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, blogs });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch blogs" });
  }
};

const getBlogsByDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const blogs = await Blog.find({ doctorId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, blogs });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch doctor's blogs" });
  }
};

// ✅ Delete a blog
const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.blogId);
    if (!blog)
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    await blog.deleteOne();
    res.status(200).json({ success: true, message: "Blog deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error deleting blog" });
  }
};

const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.blogId).populate(
      "doctorId",
      "username"
    );
    if (!blog) {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }
    res.status(200).json({ success: true, blog });
  } catch (err) {
    console.error("Get blog error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  uploadBlog,
  getAllBlogs,
  getBlogsByDoctor,
  getBlogById,
  deleteBlog,
};
