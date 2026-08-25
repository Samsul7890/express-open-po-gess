import passport from "passport"
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20"
import { env } from "./env"

passport.use(
  new GoogleStrategy(
    {
      clientID: env.google.clientId,
      clientSecret: env.google.clientSecret,
      callbackURL: env.google.callbackUrl,
    },
    async (_accessToken, _refreshToken, profile: Profile, done) => {
      try {
        const email = profile.emails?.[0]?.value
        const name = profile.displayName
        const googleId = profile.id

        if (!email) {
          return done(new Error("No email returned from Google"), undefined)
        }

        return done(null, { email, name, googleId } as any)
      } catch (err) {
        return done(err as Error, undefined)
      }
    }
  )
)

export default passport
