import { google } from 'googleapis';
import * as fs from 'fs';
import { Readable } from 'stream';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GoogleDriveServices {
  private drive;

  constructor(private readonly configService: ConfigService) {
    const oauth2Client = new google.auth.OAuth2(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
    );
    oauth2Client.setCredentials({
      refresh_token: this.configService.get<string>('GOOGLE_REFRESH_TOKEN'),
    });
    this.drive = google.drive({ version: 'v3', auth: oauth2Client });
  }

  async uploadFile(
    file: Express.Multer.File,
  ): Promise<{ fileId: string; fileName: string; publicUrl: string }> {
    try {
      const fileMetadata = {
        name: file.originalname, // File name to display in Google Drive
        parents: ['1F_1m3R7qTmz09nqjRXzwswnqkPPASZTx'], // Replace with your Google Drive folder ID
      };

      const bufferStream = new Readable();
      bufferStream.push(file.buffer);
      bufferStream.push(null);

      const media = {
        mimeType: file.mimetype,
        body: bufferStream, // Read the file content
      };

      // Upload the file
      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media,
        fields: 'id, name',
      });
      const fileId = response.data.id;

      // Step 2: Make the file publicly accessible
      await this.drive.permissions.create({
        fileId,
        requestBody: {
          role: 'reader', // Permissions: reader
          type: 'anyone', // Visibility: anyone with the link
        },
      });

      // Step 3: Construct the public URL
      // const publicUrl = `https://drive.google.com/uc?id=${fileId}&export=view`;
      const publicUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
      return {
        fileId,
        fileName: response.data.name,
        publicUrl, // Return the public URL
      };
    } catch (error) {
      console.error('Error uploading to Google Drive:', error.message);
      throw error;
    }
  }

  async deleteFile(publicUrl): Promise<{ status: boolean; message: string }> {
    try {
      // Step 1: Extract fileId from the public URL
      const url = new URL(publicUrl);
      const fileId = url.searchParams.get('id');

      if (!fileId) {
        throw new Error('Invalid public URL: Unable to extract fileId.');
      }

      // Step 2: Delete the file from Google Drive
      await this.drive.files.delete({
        fileId,
      });

      return {
        status: true,
        message: `File with ID ${fileId} has been deleted successfully.`,
      };
    } catch (error) {
      console.error('Error deleting file:', error.message);
      return {
        status: false,
        message: `Failed to delete the file: ${error.message}`,
      };
    }
  }

  async getImageFromFileId(id: string): Promise<Buffer> {
    try {
      // Step 1: Extract fileId from the public URL
      const publicUrl = `https://drive.usercontent.google.com/download?id=${id}&export=view&authuser=0`;
      const url = new URL(publicUrl);
      const fileId = url.searchParams.get('id');
      // Step 1: Get the file content using the fileId
      const response = await this.drive.files.get(
        {
          fileId,
          alt: 'media', // This tells Google Drive to return the file's binary content
        },
        { responseType: 'arraybuffer' }, // Set response type to receive the file as an array buffer
      );

      // Step 2: Return the image content as a Buffer
      return await Buffer.from(response.data);
    } catch (error) {
      console.error('Error fetching image from Google Drive:', error.message);
      throw new Error('Unable to fetch the image');
    }
  }
}
