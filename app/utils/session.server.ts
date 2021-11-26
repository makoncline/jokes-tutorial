import { db } from "./db.server";
import bcrypt from "bcrypt";
import { createCookieSessionStorage, redirect } from "remix";

type Login = {
  username: string;
  password: string;
}

export async function register({username, password}: Login){
  const passwordHash =  await bcrypt.hash(password, 10)
  const user = db.user.create({ 
    data: {username,passwordHash}
  })
  return user
}

export async function login( {username, password}: Login ) {
  const existingUser = await db.user.findUnique({where: {username} });
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

 function getUserSession(request: Request){
  return storage.getSession(request.headers.get('Cookie'))
}

export async function getUserId(request: Request) {
  const session = await getUserSession(request)
  const userId = session.get('userId')
  if (!userId ||typeof userId !== 'string') return null
  return userId
}

export async function requireUserId(
  request: Request, 
  redirectTo: string = new URL(request.url).pathname
  ) {
  const userId = await getUserId(request)
  if (!userId) {
    const params = new URLSearchParams([['redirectTo', redirectTo]])
    throw redirect(`/login?${params}`)
  }
  return userId
}

export async function getUser(request: Request) {
  const userId = await getUserId(request)
  if (!userId) return null
  return db.user.findUnique({where: {id: userId}})
}

export async function logout(request: Request){
  let session = await getUserSession(request)
  return redirect(`/jokes`, {
    headers: {
      'Set-Cookie': await storage.destroySession(session)
    }})
}