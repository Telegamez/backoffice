"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, FolderOpen, Bot, Loader2, Search, ExternalLink, Users, HardDrive } from 'lucide-react';

interface DriveDocument {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  modifiedTime?: string;
  webViewLink?: string;
  driveId?: string;
  driveName?: string;
}

interface SharedDrive {
  id: string;
  name: string;
  createdTime?: string;
  hidden?: boolean;
}

interface DocumentPickerProps {
  onDocumentSelect?: (document: DriveDocument) => void;
  selectedDocumentId?: string;
}

export default function DocumentPicker({ onDocumentSelect, selectedDocumentId }: DocumentPickerProps) {
  const [documents, setDocuments] = useState<DriveDocument[]>([]);
  const [sharedDrives, setSharedDrives] = useState<SharedDrive[]>([]);
  const [loading, setLoading] = useState(false);
  const [drivesLoading, setDrivesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDriveScope, setSelectedDriveScope] = useState<'all' | 'my-drive' | string>('all');

  const loadSharedDrives = async () => {
    setDrivesLoading(true);
    try {
      const response = await fetch('/api/mail-assistant/shared-drives');
      const data = await response.json();
      
      if (data.success) {
        setSharedDrives(data.drives);
      } else {
        console.warn('Failed to load shared drives:', data.message);
      }
    } catch (err) {
      console.warn('Error loading shared drives:', err);
    } finally {
      setDrivesLoading(false);
    }
  };

  const loadDocuments = async (query?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      params.set('pageSize', '10');
      
      // Add drive scope to API call
      if (selectedDriveScope === 'my-drive') {
        params.set('scope', 'my-drive');
      } else if (selectedDriveScope !== 'all') {
        params.set('scope', 'shared-drive');
        params.set('driveId', selectedDriveScope);
      }
      
      const response = await fetch(`/api/mail-assistant/documents?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setDocuments(data.documents);
      } else {
        setError(data.message || 'Failed to load documents');
      }
    } catch (err) {
      setError('Failed to connect to Google Drive');
      console.error('Error loading documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
    loadSharedDrives();
  }, []); // Initial load only

  useEffect(() => {
    loadDocuments(searchQuery);
  }, [selectedDriveScope]); // Re-load when drive scope changes

  const handleSearch = () => {
    loadDocuments(searchQuery);
  };

  const handleDocumentSelect = (document: DriveDocument) => {
    onDocumentSelect?.(document);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('document')) return '📄';
    if (mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('pdf')) return '📕';
    return '📄';
  };

  const getDriveIcon = (doc: DriveDocument) => {
    if (doc.driveId) {
      return <Users className="h-4 w-4 text-blue-500" />;
    }
    return <HardDrive className="h-4 w-4 text-gray-500" />;
  };

  const getDriveLabel = (doc: DriveDocument) => {
    if (doc.driveId && doc.driveName) {
      return doc.driveName;
    }
    return 'My Drive';
  };

  if (error && error.includes('Unauthorized')) {
    return (
      <div className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Select Document from Google Drive
          </h2>
        </div>
        <div className="rounded-lg border bg-background p-6">
          <div className="text-center text-muted-foreground">
            <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="mb-4">Please sign in to access Google Drive</p>
            <Button onClick={() => window.location.href = '/api/auth/signin'}>
              <Bot className="h-4 w-4 mr-2" />
              Sign In with Google
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          Select Document from Google Drive
        </h2>
      </div>
      
      {/* Drive Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Search in:</label>
        <select 
          value={selectedDriveScope}
          onChange={(e) => setSelectedDriveScope(e.target.value)}
          className="w-full p-2 border rounded-lg bg-background"
          disabled={drivesLoading}
        >
          <option value="all">All Drives (My Drive + Shared Drives)</option>
          <option value="my-drive">My Drive Only</option>
          {sharedDrives.map((drive) => (
            <option key={drive.id} value={drive.id}>
              📁 {drive.name}
            </option>
          ))}
        </select>
        {drivesLoading && (
          <p className="text-sm text-muted-foreground mt-1">
            <Loader2 className="h-3 w-3 inline animate-spin mr-1" />
            Loading shared drives...
          </p>
        )}
      </div>

      {/* Search Bar */}
      <div className="mb-4 flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background"
          />
        </div>
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>

      {/* Document List */}
      <div className="rounded-lg border bg-background">
        {loading && documents.length === 0 ? (
          <div className="p-6 text-center">
            <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground">Loading documents...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-500">
            <p className="mb-4">Error: {error}</p>
            <Button onClick={() => loadDocuments()} variant="outline">
              Try Again
            </Button>
          </div>
        ) : documents.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No documents found</p>
            <p className="text-sm mt-2">Try a different search term</p>
          </div>
        ) : (
          <div className="divide-y">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                  selectedDocumentId === doc.id ? 'bg-muted' : ''
                }`}
                onClick={() => handleDocumentSelect(doc)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-2xl">{getFileIcon(doc.mimeType)}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{doc.name}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          {getDriveIcon(doc)}
                          <span>{getDriveLabel(doc)}</span>
                        </div>
                        <span>{formatDate(doc.modifiedTime)}</span>
                        {doc.size && <span>{formatFileSize(doc.size)}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.webViewLink && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(doc.webViewLink, '_blank');
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant={selectedDocumentId === doc.id ? "default" : "outline"}
                    >
                      {selectedDocumentId === doc.id ? 'Selected' : 'Select'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {documents.length > 0 && (
        <div className="mt-4 text-center">
          <Button
            variant="outline"
            onClick={() => loadDocuments(searchQuery)}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Refresh
          </Button>
        </div>
      )}
    </div>
  );
}