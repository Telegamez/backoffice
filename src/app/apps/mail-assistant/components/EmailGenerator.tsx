"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Bot, Users, Send, Edit, Loader2 } from 'lucide-react';

interface Recipient {
  name: string;
  email: string;
  personalizationContext?: Record<string, unknown>;
}

interface GeneratedEmail {
  recipient: Recipient;
  subject: string;
  content: string;
  personalizationApplied: string[];
  confidence: number;
}

interface EmailGeneratorProps {
  recipients?: Recipient[];
}

export default function EmailGenerator({ 
  recipients = []
}: EmailGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedEmails] = useState<GeneratedEmail[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('professional');

  const handleGenerateEmails = async () => {
    setIsGenerating(true);
    // This will be implemented in Phase 3 with GPT-5 integration
    setTimeout(() => {
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Bulk Email Generation
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recipients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Add recipients to generate personalized emails</p>
              <p className="text-sm mt-2">Recipients can be extracted from document analysis</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email Template Style</label>
                <select 
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled
                >
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="formal">Formal</option>
                  <option value="casual">Casual</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{recipients.length} recipients selected</p>
                  <p className="text-sm text-gray-600">Emails will be personalized using document context</p>
                </div>
                <Button 
                  onClick={handleGenerateEmails}
                  disabled={isGenerating}
                  className="ml-4"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Bot className="h-4 w-4 mr-2" />
                      Generate Emails
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
          
          {/* Placeholder for future implementation */}
          <div className="mt-6 text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
            <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Email generation will be implemented in Phase 3</p>
            <p className="text-sm mt-2">AI-powered personalization with 30s-2min processing time</p>
            <p className="text-xs mt-1 text-gray-400">Background processing with progress tracking</p>
          </div>
        </CardContent>
      </Card>

      {generatedEmails.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Emails ({generatedEmails.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {generatedEmails.map((email, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium">{email.recipient.name}</p>
                      <p className="text-sm text-gray-600">{email.recipient.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-green-600">{email.confidence}% confidence</p>
                      <div className="flex gap-2 mt-1">
                        <Button size="sm" variant="outline">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Send className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded p-3 mt-2">
                    <p className="font-medium text-sm mb-1">Subject: {email.subject}</p>
                    <p className="text-sm text-gray-700 line-clamp-3">{email.content}</p>
                  </div>
                  {email.personalizationApplied.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">
                        Personalization: {email.personalizationApplied.join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}