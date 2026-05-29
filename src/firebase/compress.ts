export const compressImage = (file: File, maxKB = 180): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let quality = 0.8;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        let { width, height } = img;

        if (width > 1200) {
          height = height * (1200 / width);
          width = 1200;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const compress = () => {
          const url = canvas.toDataURL('image/jpeg', quality);
          const kb = (url.length * 3) / 4 / 1024;
          if (kb > maxKB && quality > 0.1) {
            quality -= 0.1;
            return compress();
          }
          resolve(url);
        };

        compress();
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
