import { request } from './api';

export const photoApi = {
  // Obtener fotos con filtros opcionales
  async getAll(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/photos?${query}` : '/photos';
    const res = await request(endpoint);
    return res.data;
  },

  // Obtener estadísticas
  async getStats() {
    const res = await request('/photos/stats');
    return res.data;
  },

  // Registrar foto en la base de datos
  async create(photoData) {
    const res = await request('/photos', {
      method: 'POST',
      body: photoData,
    });
    return res.data;
  },

  // Dar like a una foto
  async like(id) {
    const res = await request(`/photos/${id}/like`, {
      method: 'POST',
    });
    return res.data;
  },

  // Actualizar estado de moderación (approved, hidden, pending)
  async updateStatus(id, status) {
    const res = await request(`/photos/${id}/status`, {
      method: 'PATCH',
      body: { status },
    });
    return res.data;
  },

  // Eliminar foto
  async delete(id) {
    const res = await request(`/photos/${id}`, {
      method: 'DELETE',
    });
    return res.data;
  },

  // Compresión en el navegador con Canvas (reduce fotos de 12MB a ~250KB en milisegundos)
  compressImage(file, maxDimension = 1600, quality = 0.85) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          let { width, height } = img;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convertir a base64 Data URL comprimido
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  },

  // Subida opcional directa a Cloudinary si está configurado
  async uploadToCloudinary(fileOrDataUrl, cloudName, uploadPreset) {
    const formData = new FormData();
    formData.append('file', fileOrDataUrl);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', 'boda_ed_recuerdos');

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || 'Error al subir imagen a Cloudinary');
    }

    const data = await res.json();
    return {
      url: data.secure_url,
      thumbnailUrl: data.secure_url.replace('/upload/', '/upload/c_thumb,w_400/'),
      storageKey: data.public_id,
    };
  }
};
