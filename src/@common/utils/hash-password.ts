import { genSalt, hash } from 'bcrypt'

export async function hashPassword(
  password: string,
  rounds = 10,
): Promise<string> {
  const salt = await genSalt(rounds)
  const hashPassword = await hash(password, salt)
  return hashPassword
}
