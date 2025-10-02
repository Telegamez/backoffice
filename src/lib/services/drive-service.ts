import { GoogleAPIClient } from '../google-api';
import { db } from '@/db/index';
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
  driveId?: string; // For shared drive files
  driveName?: string; // Human-readable shared drive name
}

export interface SharedDrive {
  id: string;
  name: string;
  createdTime?: string;
  hidden?: boolean;
}

export class DriveService {
  private googleClient: GoogleAPIClient;
  private userEmail: string;

  constructor(userEmail: string) {
    this.userEmail = userEmail;
    this.googleClient = new GoogleAPIClient(userEmail);
  }

  async getSharedDrives(): Promise<SharedDrive[]> {
    const startTime = Date.now();
    
    try {
      const drive = await this.googleClient.getDriveClient();
      
      const response = await drive.drives.list({
        pageSize: 100,
        fields: 'drives(id,name,createdTime,hidden)',
      });

      const drives = response.data.drives || [];

      // Log successful access
      await db.insert(adminAssistantAudit).values({
        userEmail: this.userEmail,
        actionType: 'drive_read',
        operation: 'list_shared_drives',
        details: {
          metadata: {
            sharedDriveCount: drives.length,
          },
        },
        success: true,
        responseTimeMs: Date.now() - startTime,
      });

      return drives.map(drive => ({
        id: drive.id!,
        name: drive.name!,
        createdTime: drive.createdTime || undefined,
        hidden: drive.hidden || false,
      }));
    } catch (error) {
      // Log failure
      await db.insert(adminAssistantAudit).values({
        userEmail: this.userEmail,
        actionType: 'drive_read',
        operation: 'list_shared_drives',
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

  async getDocument(fileId: string): Promise<DriveDocument> {
    const startTime = Date.now();
    
    try {
      const drive = await this.googleClient.getDriveClient();
      
      // Get file metadata including drive information
      const fileResponse = await drive.files.get({
        fileId,
        fields: 'id,name,mimeType,size,createdTime,modifiedTime,webViewLink,driveId',
        supportsAllDrives: true, // Support shared drives
      });

      const file = fileResponse.data;
      if (!file.id || !file.name) {
        throw new Error('Invalid file response from Google Drive');
      }

      // Get drive name if file is from a shared drive
      let driveName: string | undefined;
      if (file.driveId) {
        try {
          const driveResponse = await drive.drives.get({
            driveId: file.driveId,
            fields: 'name',
          });
          driveName = driveResponse.data.name || undefined;
        } catch (driveError) {
          console.warn(`Could not get drive name for drive ${file.driveId}:`, driveError);
        }
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
              supportsAllDrives: true, // Support shared drives
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
        driveId: file.driveId || undefined,
        driveName,
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
    // This method now searches across both My Drive and shared drives
    return this.listAllDocuments(query, pageSize);
  }

  async listAllDocuments(query?: string, pageSize: number = 20): Promise<DriveDocument[]> {
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

      // Search across all drives (My Drive + Shared Drives)
      const response = await drive.files.list({
        q: searchQuery,
        pageSize,
        fields: 'files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink,driveId)',
        orderBy: 'modifiedTime desc',
        includeItemsFromAllDrives: true, // Include shared drive files
        supportsAllDrives: true, // Support shared drives
        corpora: 'allDrives', // Search in all drives
      });

      const files = response.data.files || [];

      // Get unique drive IDs for batch lookup
      const driveIds = [...new Set(files.filter(f => f.driveId).map(f => f.driveId!))];
      const driveNames: Record<string, string> = {};

      // Batch fetch drive names for efficiency
      if (driveIds.length > 0) {
        for (const driveId of driveIds) {
          try {
            const driveResponse = await drive.drives.get({
              driveId,
              fields: 'name',
            });
            if (driveResponse.data.name) {
              driveNames[driveId] = driveResponse.data.name;
            }
          } catch (driveError) {
            console.warn(`Could not get drive name for drive ${driveId}:`, driveError);
          }
        }
      }

      // Log successful access
      await db.insert(adminAssistantAudit).values({
        userEmail: this.userEmail,
        actionType: 'drive_read',
        operation: 'list_all_drives',
        details: {
          metadata: {
            query,
            resultCount: files.length,
            sharedDriveFiles: files.filter(f => f.driveId).length,
            uniqueSharedDrives: driveIds.length,
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
        driveId: file.driveId || undefined,
        driveName: file.driveId ? driveNames[file.driveId] : undefined,
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

  async listMyDriveDocuments(query?: string, pageSize: number = 20): Promise<DriveDocument[]> {
    const startTime = Date.now();
    
    try {
      const drive = await this.googleClient.getDriveClient();
      
      // Build search query for supported document types in My Drive only
      const supportedTypes = [
        "mimeType='application/vnd.google-apps.document'",
        "mimeType='application/vnd.google-apps.spreadsheet'", 
        "mimeType='application/pdf'",
        "mimeType='text/plain'",
      ];
      
      let searchQuery = `(${supportedTypes.join(' or ')}) and trashed=false and 'me' in owners`;
      
      if (query && query.trim()) {
        searchQuery = `name contains '${query.trim()}' and (${supportedTypes.join(' or ')}) and trashed=false and 'me' in owners`;
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
        operation: 'list_my_drive',
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
        // No driveId for My Drive files
      }));
    } catch (error) {
      // Log failure
      await db.insert(adminAssistantAudit).values({
        userEmail: this.userEmail,
        actionType: 'drive_read',
        operation: 'list_my_drive',
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

  async listSharedDriveDocuments(driveId?: string, query?: string, pageSize: number = 20): Promise<DriveDocument[]> {
    const startTime = Date.now();
    
    try {
      const drive = await this.googleClient.getDriveClient();
      
      // Build search query for supported document types in shared drives
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
        fields: 'files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink,driveId)',
        orderBy: 'modifiedTime desc',
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
        corpora: driveId ? 'drive' : 'allDrives',
        driveId: driveId, // Search specific drive if provided
      });

      const files = response.data.files || [];

      // Get drive names for the results
      const driveIds = [...new Set(files.filter(f => f.driveId).map(f => f.driveId!))];
      const driveNames: Record<string, string> = {};

      if (driveIds.length > 0) {
        for (const id of driveIds) {
          try {
            const driveResponse = await drive.drives.get({
              driveId: id,
              fields: 'name',
            });
            if (driveResponse.data.name) {
              driveNames[id] = driveResponse.data.name;
            }
          } catch (driveError) {
            console.warn(`Could not get drive name for drive ${id}:`, driveError);
          }
        }
      }

      // Log successful access
      await db.insert(adminAssistantAudit).values({
        userEmail: this.userEmail,
        actionType: 'drive_read',
        operation: 'list_shared_drives',
        details: {
          metadata: {
            query,
            driveId,
            resultCount: files.length,
            uniqueSharedDrives: driveIds.length,
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
        driveId: file.driveId || undefined,
        driveName: file.driveId ? driveNames[file.driveId] : undefined,
      }));
    } catch (error) {
      // Log failure
      await db.insert(adminAssistantAudit).values({
        userEmail: this.userEmail,
        actionType: 'drive_read',
        operation: 'list_shared_drives',
        details: {
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          metadata: {
            query,
            driveId,
          },
        },
        success: false,
        responseTimeMs: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
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