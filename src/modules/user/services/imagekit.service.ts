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

  constructor(private configService: ConfigService) {
    const publicKey = this.configService.get<string>('imagekit.publicKey');
    const privateKey = this.configService.get<string>('imagekit.privateKey');
    const urlEndpoint = this.configService.get<string>('imagekit.urlEndpoint');

    if (!publicKey || !privateKey || !urlEndpoint) {
      throw new Error('ImageKit credentials are not configured');
    }

    this.imagekit = new ImageKit({
      publicKey: publicKey,
      privateKey: privateKey,
      urlEndpoint: urlEndpoint,
    });
  }

  /**
   * Upload image to ImageKit
   */
  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'users',
  ): Promise<{ url: string; fileId: string; fileName: string }> {
    try {
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
      const response = await this.imagekit.upload({
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
      await this.imagekit.deleteFile(fileId);
    } catch (error) {
      console.error('Failed to delete image:', error);
    }
  }

  /**
   * Get image details
   */
  async getImageDetails(fileId: string): Promise<any> {
    try {
      const details = await this.imagekit.getFileDetails(fileId);
      return details;
    } catch (error) {
      throw new BadRequestException('Image not found');
    }
  }
}
