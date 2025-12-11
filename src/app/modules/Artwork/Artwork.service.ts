import { Artwork, Prisma } from "@prisma/client";
import prisma from "../../utils/prisma";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import redisClient from "../../config/redis";
import { json } from "stream/consumers";
const CACHE_TTL = 10 * 60
export const artworkSearchableFields = [
  'title',
  'medium',
  'series',
  'shortDescription',
  'year',
  'size',
  'uniqueLimitedEdition',
];


const invalidateArtworkCache = async () => {
  await redisClient.del("artworks:all");
  await redisClient.del("artworks:featured");
  await redisClient.del("artworks:stats");
};
const createArtwork = async ( userId:string,payload: Artwork): Promise<Artwork> => {


    console.log(payload,userId)
  if (!payload?.title || !payload.imageUrl || !userId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Title, image URL, and user ID are required");
  }

  const result = await prisma.artwork.create({
    data: {
      userId: userId,
      title: payload.title,
      year: payload.year ,
      framed: payload.framed ,
      size: payload.size ,
      medium: payload.medium ,
      forSale: payload.forSale || false,
      price: payload.price ,
      purchaseLink: payload.purchaseLink ,
      series: payload.series ,
      uniqueLimitedEdition: payload.uniqueLimitedEdition ,
      altText: payload.altText ,
      shortDescription: payload.shortDescription ,
      imageUrl: payload.imageUrl,
    },
  });

    await invalidateArtworkCache();
  return result;
};

const getAllArtworks = async (query: Record<string, any>) => {
     const cacheKey=`artworks:all:${JSON.stringify(query)}`
    const cached=await redisClient.get(cacheKey)
    if(cached) return JSON.parse(cached)
  const queryBuilder = new QueryBuilder(prisma.artwork, query)
    .search(artworkSearchableFields)
    .filter()
    .sort()
    .paginate()
    .include({
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profilePic: true,
        },
      },
    });

  const [artworks, pagination] = await Promise.all([
    queryBuilder.execute(),
    queryBuilder.countTotal(),
  ]);

  console.log("check art work",artworks)


   await redisClient.setEx(cacheKey,CACHE_TTL,JSON.parse(artworks))

  return {
    artworks,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      pages: pagination.totalPage,
    },
  };
};

const getArtworksByUser = async (userId: string, query: Record<string, any>) => {

    const cacheKey=`artworks:user:${userId}:${JSON.stringify(query)}`

    const cached=await redisClient.get(cacheKey)

    if(cached) return JSON.parse(cached)

  const queryBuilder = new QueryBuilder(prisma.artwork, { ...query, userId })
    .search(artworkSearchableFields)
    .filter()
    .sort()
    .paginate()
    .include({
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profilePic: true,
        },
      },
    });

  const [artworks, pagination] = await Promise.all([
    queryBuilder.execute(),
    queryBuilder.countTotal(),
  ]);

  await redisClient.setEx(cacheKey,CACHE_TTL,JSON.stringify(artworks))

  return {
    artworks,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      pages: pagination.totalPage,
    },
  };
};

const getSingleArtwork = async (id: string) => {

     const cacheKey = `artworks:single:${id}`;
  const cached = await redisClient.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const artwork = await prisma.artwork.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profilePic: true,
        },
      },
    },
  });

  if (!artwork) {
    throw new AppError(httpStatus.NOT_FOUND, "Artwork not found");
  }


  await redisClient.setEx(cacheKey,CACHE_TTL,JSON.stringify(artwork))
  return artwork;
};

const updateArtwork = async (id: string, payload: any, userId: string) => {
  const existingArtwork = await prisma.artwork.findUnique({
    where: { id },
  });

  if (!existingArtwork) {
    throw new AppError(httpStatus.NOT_FOUND, "Artwork not found");
  }

  if (existingArtwork.userId !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to update this artwork");
  }

  if (payload.price) {
    payload.price = new Prisma.Decimal(payload.price);
  }

  const result = await prisma.artwork.update({
    where: { id },
    data: {
      ...payload,
      updatedAt: new Date(),
    },
  });

  await invalidateArtworkCache();
  await redisClient.del(`artworks:single:${id}`);

  return result;
};

const deleteArtwork = async (id: string, userId: string) => {
  const existingArtwork = await prisma.artwork.findUnique({
    where: { id },
  });

  if (!existingArtwork) {
    throw new AppError(httpStatus.NOT_FOUND, "Artwork not found");
  }

  if (existingArtwork.userId !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to delete this artwork");
  }

  await prisma.artwork.delete({
    where: { id },
  });

    await invalidateArtworkCache();
  await redisClient.del(`artworks:single:${id}`);
  return { message: "Artwork deleted successfully" };
};

const getFeaturedArtworks = async (limit?: number) => {

    const cacheKey = `artworks:featured:${limit || "default"}`;
  const cached = await redisClient.get(cacheKey);
  if (cached) return JSON.parse(cached);
  const takeLimit = limit || 10;

  const result = await prisma.artwork.findMany({
    where: {
      forSale: true,
    },
    take: takeLimit,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          profilePic: true,
        },
      },
    },
  });

  await invalidateArtworkCache();
  await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(result));

  return result;
};

const getArtworkStatistics = async (userId?: string) => {

     const cacheKey = `artworks:stats:${userId || "all"}`;
  const cached = await redisClient.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const whereCondition = userId ? { userId } : {};

  const totalArtworks = await prisma.artwork.count({
    where: whereCondition,
  });

  const forSaleArtworks = await prisma.artwork.count({
    where: {
      ...whereCondition,
      forSale: true,
    },
  });

  const framedArtworks = await prisma.artwork.count({
    where: {
      ...whereCondition,
      framed: true,
    },
  });

  const artworksByMedium = await prisma.artwork.groupBy({
    by: ["medium"],
    where: whereCondition,
    _count: {
      id: true,
    },
  });

  const artworksByYear = await prisma.artwork.groupBy({
    by: ["year"],
    where: whereCondition,
    _count: {
      id: true,
    },
    orderBy: {
      year: "desc",
    },
  });

  const data = {
    totalArtworks,
    forSaleArtworks,
    framedArtworks,
    statistics: {
      byMedium: artworksByMedium,
      byYear: artworksByYear,
    },
  };

  await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(data));
};

export const artworkService = {
  createArtwork,
  getAllArtworks,
  getArtworksByUser,
  getSingleArtwork,
  updateArtwork,
  deleteArtwork,
  getFeaturedArtworks,
  getArtworkStatistics,
};