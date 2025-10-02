"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { /* FileText, */ Loader2, Search } from 'lucide-react';

// Simplified DriveDocument interface for this component
export interface DriveDocument {
  id: string;
  name: string;
  mimeType: string;
}

interface DocumentSelectorProps {
  onDocumentSelect: (document: DriveDocument) => void;
}

const DocumentSelector: React.FC<DocumentSelectorProps> = ({ onDocumentSelect }) => {
  const [documents, setDocuments] = useState<DriveDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadDocuments = async (query = '') => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ q: query, pageSize: '5' });
      const response = await fetch(`/api/mail-assistant/documents?${params}`);
      const data = await response.json();
      if (data.success) {
        setDocuments(data.documents);
      } else {
        setError(data.message || 'Failed to load documents');
      }
    } catch (err) {
      // console.error(err);
      setError('Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleSearch = () => {
    loadDocuments(searchQuery);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Select a Document for Context</h3>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="w-full p-2 border rounded-md"
        />
        <Button onClick={handleSearch} disabled={loading}>
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-lg border bg-background min-h-[200px]">
        {loading ? (
          <div className="p-6 text-center text-muted-foreground">
            <Loader2 className="h-8 w-8 mx-auto animate-spin" />
            <p>Loading documents...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-500">{error}</div>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              className="p-3 hover:bg-muted/50 cursor-pointer border-b"
              onClick={() => onDocumentSelect(doc)}
            >
              <h4 className="font-medium">{doc.name}</h4>
              <p className="text-sm text-muted-foreground">{doc.mimeType}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DocumentSelector;
