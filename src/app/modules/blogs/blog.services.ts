import prisma from "../../utils/prisma";

const createBlog = async (payload: any) => {
  const result = await prisma.$transaction(async (tx) => {
    const blog = await tx.blog.create({
      data: {
        title: payload.title,
        description: payload.description,
        image: payload.image,
        category: payload.category,
        views: payload.views || 0,
      },
    });

    console.log("Blog created:", blog);
    return blog;
  });
  return result;
};

const getAllBlogs = async () => {
  const blogs = await prisma.blog.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
  return blogs;
};

const getSingleBlog = async (id: string) => {
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
  return result;
};

export const blogService = {
  createBlog,
  getAllBlogs,
  getSingleBlog,
  updateBlog,
  deleteBlog,
};