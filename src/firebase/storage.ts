import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import app from './config';
import { compressImage } from './compress';
import { updateUserPhoto } from './firestore';

const storage = getStorage(app);

export const uploadProfilePicture = async (uid: string, file: File): Promise<string> => {
  const dataUrl = await compressImage(file, 300);
  const storageRef = ref(storage, `profiles/${uid}.jpg`);
  await uploadString(storageRef, dataUrl, 'data_url');
  const url = await getDownloadURL(storageRef);
  await updateUserPhoto(uid, url);
  return url;
};
