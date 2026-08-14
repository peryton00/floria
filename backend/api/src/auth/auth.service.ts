// Floria API — Auth Service
import { userRepository } from "../database/repositories/user.repository.js";
import { Errors } from "../utils/errors.js";

export class AuthService {
  async getProfile(userId: string) {
    const profile = await userRepository.findById(userId);
    if (!profile) throw Errors.notFound("User profile");
    return profile;
  }
}

export const authService = new AuthService();
