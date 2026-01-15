import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
    constructor() {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
    }

    // Upload banners for course
    async uploadImage(file: Express.Multer.File) : Promise<UploadApiResponse | UploadApiErrorResponse> {
        return new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream({
                folder: 'lms/course-banners',
                resource_type: 'image',
                transformation: [
                    { width: 1200, height: 600, crop: 'limit', quality: 'auto' }
                ]
            },
            (error, result) => {
                if (error) return reject(error);
                if (result) {
                    resolve(result);
                } else {
                    reject(new Error('Upload failed'));
                }
            }).end(file.buffer);
        });
    }

    // delete banners for course
    async deleteImage(publicId: string): Promise<any> {
        return cloudinary.uploader.destroy(publicId);
    }

    // Upload lesson videos
    async uploadVideo(file: Express.Multer.File) : Promise<UploadApiResponse | UploadApiErrorResponse> {
        return new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream({
                folder: 'lms/lesson-videos',
                resource_type: 'video',
                chunk_size: 10000000, // 10MB
            },
            (error, result) => {
                if (error) return reject(error);
                if (result) {
                    resolve(result);
                } else {
                    reject(new Error('Video upload failed'));
                }
            }).end(file.buffer);
        });
    }

    // Upload lesson document/PDF
    async uploadDocument(file: Express.Multer.File): Promise<UploadApiResponse | UploadApiErrorResponse> {
        return new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream({
                folder: 'lms/lesson-resources',
                resource_type: 'raw', // PDFs, docs etc
                use_filename: true,
                unique_filename: true,
            },
            (error, result) => {
                if (error) return reject(error);
                if (result) {
                    resolve(result);
                } else {
                    reject(new Error('Document upload failed'));
                }
            }).end(file.buffer);
        });
    }
    
    // Upload lesson image
    async uploadLessonImage(file: Express.Multer.File): Promise<UploadApiResponse | UploadApiErrorResponse> {
        return new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream({
                folder: 'lms/lesson-images',
                resource_type: 'image',
                transformation: [
                    { width: 1000, height: 600, crop: 'limit', quality: 'auto' }
                ]
            },
            (error, result) => {
                if (error) return reject(error);
                if (result) {
                    resolve(result);
                } else {
                    reject(new Error('Image upload failed'));
                }
            }).end(file.buffer);
        });
    }

    // Delete any resource
    async deleteResource(publicId: string, resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<any> {
        try {
            return await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        } catch (error) {
            console.error(`Failed to delete resource ${publicId}:`, error);
            return { result: 'not found' };
        }
    }


    // Delete multiple resources
    async deleteMultipleResources(publicIds: string[], resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<any> {
        const deletePromises = publicIds.map(publicId => this.deleteResource(publicId, resourceType));
        return Promise.allSettled(deletePromises); 
    }
}
