import {
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { GalleryService } from './gallery.service';
import { CatPhoto } from './cat-photo.interface';

@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  // ── GET /api/gallery/photos ───────────────────────────────────────────────

  @Get('photos')
  async getPhotos(): Promise<CatPhoto[]> {
    return this.galleryService.getPhotos();
  }

  // ── POST /api/gallery/upload ──────────────────────────────────────────────

  /**
   * Accepts multipart/form-data with fields: file, title, description.
   * Stores the image in Vercel Blob and appends the new photo to the
   * gallery metadata (also stored in Vercel Blob).
   */
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', { storage: memoryStorage() }),
  )
  async uploadPhoto(
    @UploadedFile() file: Express.Multer.File,
    @Body('title') title: string,
    @Body('description') description: string,
  ): Promise<CatPhoto> {
    if (!file) {
      throw new BadRequestException('No file provided.');
    }
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are accepted.');
    }
    if (!title?.trim()) {
      throw new BadRequestException('Title is required.');
    }
    if (!description?.trim()) {
      throw new BadRequestException('Description is required.');
    }

    return this.galleryService.uploadPhoto(file, title, description);
  }
}
