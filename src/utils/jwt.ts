import { SignJWT, jwtVerify } from "jose";

const SECRET_KEY_STRING = process.env.NEXTAUTH_SECRET || "secret_jwt_key_here_minimum_32_characters";
const JWT_SECRET = new TextEncoder().encode(SECRET_KEY_STRING);

export interface JWTPayload {
  userId: string;
  nik: string;
  role: string;
  name: string;
}

// JWT signing
export async function signJWT(payload: JWTPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h") // Sesi berlaku selama 8 jam
    .sign(JWT_SECRET);
}

// JWT verification
export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch (error) {
    return null;
  }
}
