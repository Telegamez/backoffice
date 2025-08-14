import { GoogleAPIClient } from '../google-api';
import { db } from '../db';
import { adminAssistantAudit } from '@/db/db-schema';

export interface DriveDocument {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  createdTime?: string;
  modifiedTime?: string;
  content?: string;
  webViewLink?: string;
}

export class DriveService {
  private googleClient: GoogleAPIClient;
  private userEmail: string;

  constructor(userEmail: string) {
    this.userEmail = userEmail;
    this.googleClient = new GoogleAPIClient(userEmail);
  }

  async getDocument(fileId: string): Promise<DriveDocument> {
    const startTime = Date.now();
    
    try {
      const drive = await this.googleClient.getDriveClient();
      
      // Get file metadata
      const fileResponse = await drive.files.get({
        fileId,
        fields: 'id,name,mimeType,size,createdTime,modifiedTime,webViewLink',
      });

      const file = fileResponse.data;
      if (!file.id || !file.name) {
        throw new Error('Invalid file response from Google Drive');
      }

      // Get file content based on type
      let content = '';
      try {
        if (file.mimeType === 'application/vnd.google-apps.document') {
          // Export Google Docs as plain text
          const exportResponse = await drive.files.export({
            fileId,
            mimeType: 'text/plain',
          });
          content = exportResponse.data as string;
        } else if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
          // Export Google Sheets as CSV
          const exportResponse = await drive.files.export({
            fileId,
            mimeType: 'text/csv',
          });
          content = exportResponse.data as string;
        } else if (file.mimeType === 'application/pdf') {
          // For PDFs, we need the actual file content
          // const fileContent = await drive.files.get({
          //   fileId,
          //   alt: 'media',
          // });
          content = '[PDF content - text extraction not yet implemented]';
        } else {
          // For other file types, try to get as plain text
          try {
            const fileContent = await drive.files.get({
              fileId,
              alt: 'media',
            });
            content = fileContent.data as string;
          } catch {
            content = '[Content extraction not supported for this file type]';
          }
        }
      } catch (exportError) {
        console.warn(`Failed to export content for file ${fileId}:`, exportError);
        content = '[Content extraction failed]';
      }

      // Log successful access
      await db.insert(adminAssistantAudit).values({
        userEmail: this.userEmail,
        actionType: 'drive_read',
        resourceId: fileId,
        resourceType: file.mimeType || 'unknown',
        operation: 'read',
        details: {
          fileName: file.name,
          metadata: {
            fileSize: file.size ? parseInt(file.size) : 0,
          },
        },
        success: true,
        responseTimeMs: Date.now() - startTime,
      });

      return {
        id: file.id,
        name: file.name,
        mimeType: file.mimeType || 'unknown',
        size: file.size ? parseInt(file.size) : undefined,
        createdTime: file.createdTime || undefined,
        modifiedTime: file.modifiedTime || undefined,
        webViewLink: file.webViewLink || undefined,
        content,
      };
    } catch (error) {
      // Log failure
      await db.insert(adminAssistantAudit).values({
        userEmail: this.userEmail,
        actionType: 'drive_read',
        resourceId: fileId,
        operation: 'read',
        details: {
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
        success: false,
        responseTimeMs: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async listDocuments(query?: string, pageSize: number = 20): Promise<DriveDocument[]> {
    const startTime = Date.now();
    
    try {
      const drive = await this.googleClient.getDriveClient();
      
      // Build search query for supported document types
      const supportedTypes = [
        "mimeType='application/vnd.google-apps.document'",
        "mimeType='application/vnd.google-apps.spreadsheet'", 
        "mimeType='application/pdf'",
        "mimeType='text/plain'",
      ];
      
      let searchQuery = `(${supportedTypes.join(' or ')}) and trashed=false`;
      
      if (query && query.trim()) {
        searchQuery = `name contains '${query.trim()}' and (${supportedTypes.join(' or ')}) and trashed=false`;
      }

      const response = await drive.files.list({
        q: searchQuery,
        pageSize,
        fields: 'files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink)',
        orderBy: 'modifiedTime desc',
      });

      const files = response.data.files || [];

      // Log successful access
      await db.insert(adminAssistantAudit).values({
        userEmail: this.userEmail,
        actionType: 'drive_read',
        operation: 'list',
        details: {
          metadata: {
            query,
            resultCount: files.length,
          },
        },
        success: true,
        responseTimeMs: Date.now() - startTime,
      });

      return files.map(file => ({
        id: file.id!,
        name: file.name!,
        mimeType: file.mimeType || 'unknown',
        size: file.size ? parseInt(file.size) : undefined,
        createdTime: file.createdTime || undefined,
        modifiedTime: file.modifiedTime || undefined,
        webViewLink: file.webViewLink || undefined,
      }));
    } catch (error) {
      // Log failure
      await db.insert(adminAssistantAudit).values({
        userEmail: this.userEmail,
        actionType: 'drive_read',
        operation: 'list',
        details: {
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          metadata: {
            query,
          },
        },
        success: false,
        responseTimeMs: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async searchDocuments(searchTerm: string, pageSize: number = 10): Promise<DriveDocument[]> {
    return await this.listDocuments(searchTerm, pageSize);
  }

  // Test Drive API access
  async testAccess() {
    try {
      const documents = await this.listDocuments(undefined, 1);
      return {
        success: true,
        message: 'Drive API access successful',
        documentCount: documents.length,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}