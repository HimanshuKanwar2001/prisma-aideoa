// controllers/postController.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Add a new post
export const addPost = async (req, res) => {
  const { title, description, images } = req.body; // images should be an array of image URLs or paths

  try {
    const post = await prisma.LatestNews.create({
      data: {
        title,
        description,
        images: {
          create: images.map((image) => ({
            url: image, // creating each image with its URL
          })),
        },
      },
      include: {
        images: true, // include images in the response
      },
    });
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ error: "Error creating post" });
  }
};


// Get all posts
export const getPosts = async (req, res) => {
  try {
    const posts = await prisma.LatestNews.findMany({
      include: {
        images: true, // Include related images
      },
    });

    const formattedPosts = posts.map((post) => ({
      id: post.id,
      title: post.title,
      description: post.description,
      images: post.images.map((image) => ({ url: image.url })), // Return images as an array of URLs
      createdAt: post.createdAt,
    }));

    res.status(200).json(formattedPosts);
  } catch (error) {
    res.status(500).json({ error: "Error fetching posts" });
  }
};


// Get a single post by ID
export const getPostById = async (req, res) => {
  const { id } = req.params;

  try {
    const post = await prisma.LatestNews.findUnique({
      where: { id: parseInt(id) },
      include: { images: true }, // Include related images
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const formattedPost = {
      id: post.id,
      title: post.title,
      description: post.description,
      images: post.images.map((image) => ({ url: image.url })), // Return images as an array of URLs
      createdAt: post.createdAt,
    };

    res.status(200).json(formattedPost);
  } catch (error) {
    res.status(500).json({ error: "Error fetching post" });
  }
};


// Update a post by ID
export const updatePost = async (req, res) => {
  const { id } = req.params;
  const { title, description, images } = req.body;

  try {
    // Update the post first
    const post = await prisma.LatestNews.update({
      where: { id: parseInt(id) },
      data: { title, description },
    });

    // Delete existing images
    await prisma.Image.deleteMany({
      where: { newsId: post.id },
    });

    // Re-create new images
    await prisma.Image.createMany({
      data: images.map((url) => ({
        url,
        newsId: post.id, // Link the image to the post
      })),
    });

    const updatedPost = await prisma.LatestNews.findUnique({
      where: { id: post.id },
      include: { images: true }, // Include updated images
    });

    res.status(200).json(updatedPost);
  } catch (error) {
    res.status(500).json({ error: "Error updating post" });
  }
};


// Delete a post by ID
export const deletePost = async (req, res) => {
  const { id } = req.params;

  try {
    // Delete related images first
    await prisma.Image.deleteMany({
      where: { newsId: parseInt(id) },
    });

    // Delete the post
    await prisma.LatestNews.delete({
      where: { id: parseInt(id) },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Error deleting post" });
  }
};

