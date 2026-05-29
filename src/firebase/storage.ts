import { compressImage } from './compress';
import { updateUserPhoto } from './firestore';

export const uploadProfilePicture = async (uid: string, file: File): Promise<string> => {
  const dataUrl = await compressImage(file, 300);
  await updateUserPhoto(uid, dataUrl);
  return dataUrl;
};

/** Compress example image for author applications (stored on application doc). */
export const compressApplicationExampleImage = async (file: File): Promise<string> =>
  compressImage(file, 400);
