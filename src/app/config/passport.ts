import passport, { use } from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import { Strategy as FacebookStrategy, Profile as FacebookProfile } from "passport-facebook";
import prisma from "../utils/prisma";
import config from ".";
import { jwtHelpers } from "../helpers/jwtHelpers";
import jwt from 'jsonwebtoken'
import { Strategy as AppleStrategy } from "passport-apple";
passport.use(
  new GoogleStrategy(
    {
      clientID: config.googleAuth.clientID!,
      clientSecret: config.googleAuth.clientSecret!,
      callbackURL: config.googleAuth.callbackURL!,
    },
    async (accessToken: string, refreshToken: string, profile: Profile, done) => {
     
      try {
        let user = await prisma.user.findUnique({
          where: { email: profile.emails![0].value },
        });


        if (!user) {
          user = await prisma.user.create({
            data: {
              fullName: profile.displayName,
              email: profile.emails![0].value,
              password: Math.random().toString(36).slice(-8),
              profilePic: profile.photos?.[0].value || "",
              isVerified: true,
            },
          });
        }

        const jwtPayload = {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          profilePic: user.profilePic,
          isVerified: user.isVerified,
        };

        const accessToken = jwtHelpers.createToken(
          jwtPayload,
          config.jwt.access.secret!,
          config.jwt.access.expiresIn!
        );

        done(null, { accessToken });
      } catch (err) {
        done(err, undefined);
      }
    }
  )
);


export default passport;
