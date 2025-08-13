"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Download, Clock, User, FileText, Mail, Bot } from 'lucide-react';

interface AuditEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  action: 'drive_read' | 'gmail_send' | 'ai_inference' | 'document_analysis' | 'email_generation';
  resourceId?: string;
  resourceName?: string;
  details: Record<string, unknown>;
  status: 'success' | 'error' | 'pending';
}

interface AuditLogProps {
  entries?: AuditEntry[];
  className?: string;
}

export default function AuditLog({ entries = [], className }: AuditLogProps) {
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const getActionIcon = (action: AuditEntry['action']) => {
    switch (action) {
      case 'drive_read':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'gmail_send':
        return <Mail className="h-4 w-4 text-green-500" />;
      case 'ai_inference':
      case 'document_analysis':
      case 'email_generation':
        return <Bot className="h-4 w-4 text-purple-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getActionLabel = (action: AuditEntry['action']) => {
    switch (action) {
      case 'drive_read':
        return 'Document Access';
      case 'gmail_send':
        return 'Email Sent';
      case 'ai_inference':
        return 'AI Analysis';
      case 'document_analysis':
        return 'Document Analysis';
      case 'email_generation':
        return 'Email Generation';
      default:
        return action;
    }
  };

  const getStatusColor = (status: AuditEntry['status']) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // Mock data for demonstration
  const mockEntries: AuditEntry[] = [
    {
      id: '1',
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      userId: 'user123',
      userName: 'Demo User',
      action: 'document_analysis',
      resourceId: 'doc_abc123',
      resourceName: 'Project Proposal.docx',
      details: { processingTime: '8.2s', confidence: 92 },
      status: 'success'
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
      userId: 'user123',
      userName: 'Demo User',
      action: 'drive_read',
      resourceId: 'doc_abc123',
      resourceName: 'Project Proposal.docx',
      details: { fileSize: '2.4MB' },
      status: 'success'
    }
  ];

  const displayEntries = entries.length > 0 ? entries : mockEntries;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Audit Log
        </CardTitle>
        <div className="flex items-center gap-4 mt-4">
          <div className="flex-1 relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search audit entries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm"
              disabled
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            disabled
          >
            <option value="all">All Actions</option>
            <option value="drive_read">Document Access</option>
            <option value="ai_inference">AI Analysis</option>
            <option value="gmail_send">Email Sent</option>
          </select>
          <Button variant="outline" size="sm" disabled>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {displayEntries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No audit entries yet</p>
            <p className="text-sm mt-2">Activity will be logged as you use the application</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayEntries.map((entry) => (
              <div key={entry.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getActionIcon(entry.action)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{getActionLabel(entry.action)}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(entry.status)}`}>
                          {entry.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {entry.resourceName || entry.resourceId || 'System action'}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {entry.userName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {entry.timestamp.toLocaleString()}
                        </span>
                      </div>
                      {Object.keys(entry.details).length > 0 && (
                        <div className="mt-2 text-xs text-gray-500">
                          {Object.entries(entry.details).map(([key, value]) => (
                            <span key={key} className="mr-3">
                              {key}: {String(value)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Implementation note */}
            <div className="text-center py-4 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
              <p className="text-sm">Comprehensive audit logging will be implemented in Phase 1</p>
              <p className="text-xs mt-1 text-gray-400">
                PostgreSQL-based logging with 2-year retention for compliance
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}