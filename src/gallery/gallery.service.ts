import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { put, list, del } from '@vercel/blob';
import { CatPhoto } from './cat-photo.interface';

const METADATA_KEY = 'gallery/photos-';

/**
 * All storage goes through Vercel Blob:
 *
 *   • Images    → photos/<uuid>.<ext>       (random suffix, public)
 *   • Metadata  → ggallery/photos-<uuid>       (fixed pathname, replaced on each save)
 *
 * The BLOB_READ_WRITE_TOKEN env var is read automatically by @vercel/blob.
 * Set it in Vercel's dashboard (Storage → Blob → .env.local tab) or in .env for local dev.
 */
@Injectable()
export class GalleryService {

  // ── Read photos ────────────────────────────────────────────────────────────

  async getPhotos(): Promise<CatPhoto[]> {
    try {
      const { blobs } = await list({ prefix: METADATA_KEY });
      if (!blobs.length) return [];

      const allPhotos: CatPhoto[] = [];
      for (const blob of blobs) {
        const response = await fetch(blob.url);
        if (response.ok) {
          const photos = (await response.json()) as CatPhoto[];
          allPhotos.push(...photos);
        }
      }
      return allPhotos;
    } catch {
      return [];
    }
  }

  // ── Upload photo ───────────────────────────────────────────────────────────

  async uploadPhoto(
    file: Express.Multer.File,
    title: string,
    description: string,
  ): Promise<CatPhoto> {
    // 1. Upload image to Vercel Blob
    const ext = file.originalname.split('.').pop() ?? 'jpg';
    const imageBlob = await put(
      `photos/${crypto.randomUUID()}.${ext}`,
      file.buffer,
      { access: 'public', contentType: file.mimetype },
    );

    // 2. Load + update metadata
    const photos = await this.getPhotos();
    const newId  = photos.length > 0 ? Math.max(...photos.map(p => p.id)) + 1 : 1;
    const newPhoto: CatPhoto = {
      id:          newId,
      title:       title.trim(),
      url:         imageBlob.url,
      description: description.trim(),
    };

    photos.push(newPhoto);
    await this.savePhotos(photos);

    return newPhoto;
  }

  // ── Persist metadata ───────────────────────────────────────────────────────

  private async savePhotos(photos: CatPhoto[]): Promise<void> {
    // Delete any existing metadata blob (Vercel Blob doesn't overwrite in place)
    const { blobs } = await list({ prefix: METADATA_KEY });
    if (blobs.length) {
      await del(blobs.map(b => b.url));
    }

    // Write the new metadata with a stable pathname
    await put(METADATA_KEY, JSON.stringify(photos, null, 2), {
      access:          'public',
      addRandomSuffix: false,
      contentType:     'application/json',
    });
  }
}
