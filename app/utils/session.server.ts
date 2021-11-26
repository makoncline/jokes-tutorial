import { db } from "./db.server";
import bcrypt from "bcrypt";
import { createCookieSessionStorage, redirect } from "remix";

type Login = {
  username: string;
  password: string;
}

export async function login( {username, password}: Login ) {
  const existingUser = await db.user.findFirst({where: {username} });
  if (!existingUser) return null

  const passwordsMatch = await bcrypt.compare(password, existingUser.passwordHash);
  if (!passwordsMatch) return null
  
  return existingUser
}

let sessionSecret = process.env.SESSION_SECRET
if (!sessionSecret) {
  throw new Error("No session secret set in environment variables")
}


const storage = createCookieSessionStorage({
  cookie: {
    name: 'RJ_session',
    secure: true,
    secrets: [sessionSecret],
    sameSite: "lax",
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
  }
})

export async function createUserSession(userId: string, redirectTo: string) {
  const session = await storage.getSession()
  session.set('userId', userId)
  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': await storage.commitSession(session)
    }
  })
}