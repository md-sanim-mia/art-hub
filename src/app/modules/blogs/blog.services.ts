import { json } from "stream/consumers";
import redisClient from "../../config/redis";
import prisma from "../../utils/prisma";
const CACHE_TTL = 10 * 60
const createBlog = async (payload: any) => {
  try {
    const blog = await prisma.blog.create({
      data: {
        title: payload.title,
        description: payload.description,
        image: payload.image,
        category: payload.category,
        views: payload.views || 0,
      },
    });

    // Invalidate cache
    await redisClient.del("blogs:all");

    console.log("Blog created:", blog);
    return blog;
  } catch (error) {
    console.error("Error creating blog:", error);
    throw error;
  }
};

const getAllBlogs = async () => {


  const cached =await redisClient.get("blogs:all")
  console.log("check",JSON.stringify(cached))
  if(cached) return JSON.parse(cached)
  const blogs = await prisma.blog.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  await redisClient.setEx("blogs:all",CACHE_TTL,JSON.stringify(blogs))
  return blogs;
};

const getSingleBlog = async (id: string) => {

  const cached=await redisClient.get(`blog:${id}`)

  if (cached) return JSON.stringify(cached)

    console.log(JSON.stringify(cached))

  const result = await prisma.$transaction(async (tx) => {
    const blog = await tx.blog.findUnique({
      where: { id },
    });

    if (!blog) {
      throw new Error("Blog not found");
    }

    const updated = await tx.blog.update({
      where: { id },
      data: {
        views: { increment: 1 },
      },
    });

    return updated;
  });


  await redisClient.setEx(`blog:${id}`,CACHE_TTL,JSON.stringify(result))
  return result;
};

const updateBlog = async (id: string, payload: Partial<any>) => {
  const result = await prisma.$transaction(async (tx) => {
    const updatedBlog = await tx.blog.update({
      where: { id },
      data: {
        ...payload,
        updatedAt: new Date(),
      },
    });

    console.log("Blog updated:", updatedBlog);

    await redisClient.del("blogs:all")
    await redisClient.del(`blog:${id}`)
    return updatedBlog;
  });
  return result;
};

const deleteBlog = async (id: string) => {
  const result = await prisma.$transaction(async (tx) => {
    const deleted = await tx.blog.delete({
      where: { id },
    });

    console.log("Blog deleted:", deleted);
    return deleted;
  });

  await redisClient.del("blogs:all")
  await redisClient.del(`blog:${id}`)
  return result;
};

export const blogService = {
  createBlog,
  getAllBlogs,
  getSingleBlog,
  updateBlog,
  deleteBlog,
};