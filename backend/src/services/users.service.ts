import { profilesRepository } from '../repositories/profiles.repository'
import { AppError } from '../utils/AppError'
import type { Profile, UpdateProfileInput } from '../types/user'

export async function getProfile(userId: string): Promise<Profile> {
  const profile = await profilesRepository.findById(userId)
  if (!profile) {
    // Профиль создаётся в одной транзакции с пользователем, поэтому
    // сюда можно попасть только если строку удалили руками.
    throw new AppError(404, 'PROFILE_NOT_FOUND', 'Профиль не найден')
  }
  return profile
}

export async function updateProfile(
  userId: string,
  patch: UpdateProfileInput,
): Promise<Profile> {
  return profilesRepository.update(userId, patch)
}
