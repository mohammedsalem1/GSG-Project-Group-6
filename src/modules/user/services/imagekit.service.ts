/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ImageKit from 'imagekit';

@Injectable()
export class ImageKitService {
  private imagekit: ImageKit;
  private readonly publicKey?: string;
  private readonly privateKey?: string;
  private readonly urlEndpoint?: string;

  constructor(private configService: ConfigService) {
    this.publicKey = this.configService.get<string>('imagekit.publicKey');
    this.privateKey = this.configService.get<string>('imagekit.privateKey');
    this.urlEndpoint = this.configService.get<string>('imagekit.urlEndpoint');
  }

  private ensureClient(): ImageKit {
    if (this.imagekit) {
      return this.imagekit;
    }

    if (!this.publicKey || !this.privateKey || !this.urlEndpoint) {
      throw new BadRequestException(
        'ImageKit credentials are not configured. Set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT.',
      );
    }

    this.imagekit = new ImageKit({
      publicKey: this.publicKey,
      privateKey: this.privateKey,
      urlEndpoint: this.urlEndpoint,
    });

    return this.imagekit;
  }

  /**
   * Upload image to ImageKit
   */
  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'users',
  ): Promise<{ url: string; fileId: string; fileName: string }> {
    try {
      const imagekit = this.ensureClient();

      // Validate file type
      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
      ];
      if (!allowedTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          'Invalid file type. Only JPEG, PNG, and WebP are allowed',
        );
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new BadRequestException('File size cannot exceed 5MB');
      }

      // Convert buffer to base64
      const fileBase64 = file.buffer.toString('base64');

      // Upload to ImageKit
      const response = await imagekit.upload({
        file: fileBase64,
        fileName: `${Date.now()}_${file.originalname}`,
        folder: folder,
        useUniqueFileName: true,
        tags: ['profile', 'user'],
      });

      return {
        url: response.url,
        fileId: response.fileId,
        fileName: response.name,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException('Failed to upload image: ' + errorMessage);
    }
  }

  /**
   * Delete image from ImageKit
   */
  async deleteImage(fileId: string): Promise<void> {
    try {
      const imagekit = this.ensureClient();
      await imagekit.deleteFile(fileId);
    } catch (error) {
      console.error('Failed to delete image:', error);
    }
  }

  /**
   * Get image details
   */
  async getImageDetails(fileId: string): Promise<any> {
    try {
      const imagekit = this.ensureClient();
      const details = await imagekit.getFileDetails(fileId);
      return details;
    } catch (error) {
      throw new BadRequestException('Image not found');
    }
  }
}
