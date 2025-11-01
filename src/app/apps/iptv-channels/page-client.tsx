'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Download, Play, CheckCircle, XCircle, Loader2, Upload, Trash2, Eye, FileJson, Merge, Sparkles, Send } from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
}

interface GenerationJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: {
    current: number;
    total: number;
    message: string;
  };
  result?: {
    totalChannels: number;
    validChannels: number;
    invalidChannels: number;
    outputFile: string;
  };
  error?: string;
}

interface ChannelFile {
  filename: string;
  size: number;
  created: string;
  channelCount: number;
}

const PROFILES = [
  { id: 'us-all', name: 'All US Channels', description: 'All US channels (no local affiliates)', estimated: '5,000-7,000' },
  { id: 'us-sports', name: 'US Sports', description: 'US sports channels only', estimated: '400-600' },
  { id: 'us-entertainment', name: 'US Entertainment', description: 'Movies, music, comedy', estimated: '800-1,200' },
  { id: 'us-news', name: 'US News', description: 'News channels (no local)', estimated: '200-400' },
  { id: 'us-family', name: 'US Family', description: 'Kids, education, religious', estimated: '300-500' },
  { id: 'north-america', name: 'North America', description: 'US + Canada + Mexico', estimated: '8,000-10,000' },
];

export default function IPTVChannelsClient() {
  const [activeTab, setActiveTab] = useState('profiles');
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [customCountries, setCustomCountries] = useState('US');
  const [customCategories, setCustomCategories] = useState('sports,news');
  const [excludeLocal, setExcludeLocal] = useState(true);
  const [m3u8Only, setM3u8Only] = useState(true);
  const [skipValidation, setSkipValidation] = useState(false);
  const [timeout, setTimeout] = useState(10);
  const [parallel, setParallel] = useState(10);
  const [retry, setRetry] = useState(2);

  // File management
  const [channelFiles, setChannelFiles] = useState<ChannelFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  // Validation
  const [validationFile, setValidationFile] = useState<File | null>(null);
  const [validationProgress, setValidationProgress] = useState<number | null>(null);

  // Merge
  const [mergeFiles, setMergeFiles] = useState<string[]>([]);
  const [dedupeBy, setDedupeBy] = useState<'streamURL' | 'name' | 'both'>('streamURL');

  // AI Analyze
  const [selectedFileForAI, setSelectedFileForAI] = useState<string | null>(null);
  const [aiMessages, setAiMessages] = useState<Message[]>([]);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [currentJob, setCurrentJob] = useState<GenerationJob | null>(null);
  const [jobs, setJobs] = useState<GenerationJob[]>([]);

  // Load channel files on mount
  useEffect(() => {
    loadChannelFiles();
  }, []);

  const loadChannelFiles = async () => {
    try {
      const response = await fetch('/api/iptv/files');
      if (response.ok) {
        const files = await response.json();
        setChannelFiles(files);
      }
    } catch (error) {
      console.error('Failed to load channel files:', error);
    }
  };

  const handleGenerateProfile = async (profileId: string) => {
    setCurrentJob({
      id: Date.now().toString(),
      status: 'running',
      progress: {
        current: 0,
        total: 100,
        message: 'Starting generation...'
      }
    });

    try {
      const response = await fetch('/api/iptv/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: profileId,
          skipValidation,
          timeout,
          parallel,
          retry
        })
      });

      if (!response.ok) throw new Error('Generation failed');

      const result = await response.json();

      const completedJob: GenerationJob = {
        id: Date.now().toString(),
        status: 'completed',
        result: {
          totalChannels: result.metadata.generation_stats.matched_unique,
          validChannels: result.metadata.validation?.valid || result.metadata.total_channels,
          invalidChannels: result.metadata.validation?.invalid || 0,
          outputFile: result.filename
        }
      };

      setCurrentJob(completedJob);
      setJobs(prev => [completedJob, ...prev]);
      loadChannelFiles(); // Refresh file list
    } catch (error) {
      setCurrentJob({
        id: Date.now().toString(),
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const handleGenerateCustom = async () => {
    setCurrentJob({
      id: Date.now().toString(),
      status: 'running',
      progress: {
        current: 0,
        total: 100,
        message: 'Starting custom generation...'
      }
    });

    try {
      const response = await fetch('/api/iptv/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countries: customCountries.split(',').map(c => c.trim()),
          categories: customCategories.split(',').map(c => c.trim()),
          excludeLocal,
          m3u8Only,
          skipValidation,
          timeout,
          parallel,
          retry
        })
      });

      if (!response.ok) throw new Error('Generation failed');

      const result = await response.json();

      const completedJob: GenerationJob = {
        id: Date.now().toString(),
        status: 'completed',
        result: {
          totalChannels: result.metadata.generation_stats.matched_unique,
          validChannels: result.metadata.validation?.valid || result.metadata.total_channels,
          invalidChannels: result.metadata.validation?.invalid || 0,
          outputFile: result.filename
        }
      };

      setCurrentJob(completedJob);
      setJobs(prev => [completedJob, ...prev]);
      loadChannelFiles();
    } catch (error) {
      setCurrentJob({
        id: Date.now().toString(),
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const handleValidateFile = async () => {
    if (!validationFile) return;

    setValidationProgress(0);
    const formData = new FormData();
    formData.append('file', validationFile);
    formData.append('timeout', timeout.toString());
    formData.append('parallel', parallel.toString());
    formData.append('retry', retry.toString());

    try {
      const response = await fetch('/api/iptv/validate', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Validation failed');

      const result = await response.json();
      setValidationProgress(100);

      const completedJob: GenerationJob = {
        id: Date.now().toString(),
        status: 'completed',
        result: {
          totalChannels: result.metadata.total_channels,
          validChannels: result.metadata.validation.valid,
          invalidChannels: result.metadata.validation.invalid,
          outputFile: result.filename
        }
      };

      setJobs(prev => [completedJob, ...prev]);
      loadChannelFiles();
    } catch (error) {
      setValidationProgress(null);
      alert(error instanceof Error ? error.message : 'Validation failed');
    }
  };

  const handleMergeFiles = async () => {
    if (mergeFiles.length < 2) {
      alert('Please select at least 2 files to merge');
      return;
    }

    setCurrentJob({
      id: Date.now().toString(),
      status: 'running',
      progress: {
        current: 0,
        total: 100,
        message: 'Merging files...'
      }
    });

    try {
      const response = await fetch('/api/iptv/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: mergeFiles,
          dedupeBy,
          skipValidation,
          timeout,
          parallel,
          retry
        })
      });

      if (!response.ok) throw new Error('Merge failed');

      const result = await response.json();

      const completedJob: GenerationJob = {
        id: Date.now().toString(),
        status: 'completed',
        result: {
          totalChannels: result.metadata.total_channels,
          validChannels: result.metadata.validation?.valid || result.metadata.total_channels,
          invalidChannels: result.metadata.validation?.invalid || 0,
          outputFile: result.filename
        }
      };

      setCurrentJob(completedJob);
      setJobs(prev => [completedJob, ...prev]);
      loadChannelFiles();
      setMergeFiles([]);
    } catch (error) {
      setCurrentJob({
        id: Date.now().toString(),
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const handleDeleteFile = async (filename: string) => {
    if (!confirm(`Delete ${filename}?`)) return;

    try {
      const response = await fetch(`/api/iptv/files?file=${filename}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadChannelFiles();
        setMergeFiles(prev => prev.filter(f => f !== filename));
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  const handleDownload = (filename: string) => {
    window.open(`/api/iptv/download?file=${filename}`, '_blank');
  };

  const handleAiAnalyze = async () => {
    if (!selectedFileForAI || !aiPrompt.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: aiPrompt,
    };

    setAiMessages(prev => [...prev, userMessage]);
    setIsAiLoading(true);
    setAiPrompt('');

    try {
      const response = await fetch('/api/iptv/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: selectedFileForAI,
          prompt: aiPrompt,
          conversationHistory: aiMessages,
        }),
      });

      if (!response.ok) throw new Error('AI analysis failed');

      const result = await response.json();

      let assistantContent = result.response;

      // If operation created a new file, add download link
      if (result.filename && ['filter', 'edit'].includes(result.operation)) {
        assistantContent += `\n\n✅ Created new file: **${result.filename}**\n📊 Channels: ${result.channelCount}\n\n${result.summary ? JSON.stringify(result.summary, null, 2) : ''}`;

        // Refresh file list
        loadChannelFiles();

        // Add to jobs
        const newJob: GenerationJob = {
          id: Date.now().toString(),
          status: 'completed',
          result: {
            totalChannels: result.channelCount,
            validChannels: result.channelCount,
            invalidChannels: 0,
            outputFile: result.filename,
          },
        };
        setJobs(prev => [newJob, ...prev]);
      }

      const assistantMessage: Message = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        content: assistantContent,
      };

      setAiMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        sender: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
      setAiMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">IPTV Channel Manager</h1>
        <p className="text-muted-foreground">
          Generate, validate, merge, and manage IPTV channels from the IPTV-org database
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left side - Controls */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="profiles">Profiles</TabsTrigger>
              <TabsTrigger value="custom">Custom</TabsTrigger>
              <TabsTrigger value="validate">Validate</TabsTrigger>
              <TabsTrigger value="merge">Merge</TabsTrigger>
              <TabsTrigger value="analyze">
                <Sparkles className="h-4 w-4 mr-1" />
                AI Analyze
              </TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
            </TabsList>

            {/* PROFILES TAB */}
            <TabsContent value="profiles" className="space-y-4">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Pre-configured Profiles</h3>
                <div className="grid gap-3">
                  {PROFILES.map((profile) => (
                    <div
                      key={profile.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer"
                      onClick={() => setSelectedProfile(profile.id)}
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{profile.name}</h4>
                        <p className="text-sm text-muted-foreground">{profile.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Estimated: {profile.estimated} channels
                        </p>
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenerateProfile(profile.id);
                        }}
                        disabled={currentJob?.status === 'running'}
                      >
                        {currentJob?.status === 'running' ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4 mr-2" />
                        )}
                        Generate
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* CUSTOM TAB */}
            <TabsContent value="custom" className="space-y-4">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Custom Filters</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Countries (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={customCountries}
                      onChange={(e) => setCustomCountries(e.target.value)}
                      placeholder="US,CA,GB"
                      className="w-full px-3 py-2 border rounded-md"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Example: US,CA,GB,AU
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Categories (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={customCategories}
                      onChange={(e) => setCustomCategories(e.target.value)}
                      placeholder="sports,news,entertainment"
                      className="w-full px-3 py-2 border rounded-md"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Example: sports,news,movies,cooking
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="excludeLocal"
                      checked={excludeLocal}
                      onChange={(e) => setExcludeLocal(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="excludeLocal" className="text-sm">
                      Exclude local affiliate channels
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="m3u8Only"
                      checked={m3u8Only}
                      onChange={(e) => setM3u8Only(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="m3u8Only" className="text-sm">
                      M3U8 streams only
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="skipValidation"
                      checked={skipValidation}
                      onChange={(e) => setSkipValidation(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="skipValidation" className="text-sm">
                      Skip validation (faster)
                    </label>
                  </div>

                  {!skipValidation && (
                    <div className="space-y-3 pt-2 border-t">
                      <h4 className="font-medium text-sm">Validation Settings</h4>

                      <div>
                        <label className="block text-sm mb-1">
                          Timeout (seconds): {timeout}
                        </label>
                        <input
                          type="range"
                          min="5"
                          max="30"
                          value={timeout}
                          onChange={(e) => setTimeout(parseInt(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-sm mb-1">
                          Parallel checks: {parallel}
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="20"
                          value={parallel}
                          onChange={(e) => setParallel(parseInt(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-sm mb-1">
                          Retry attempts: {retry}
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={retry}
                          onChange={(e) => setRetry(parseInt(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleGenerateCustom}
                    disabled={currentJob?.status === 'running'}
                    className="w-full mt-4"
                  >
                    {currentJob?.status === 'running' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Generate Channels
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </TabsContent>

            {/* VALIDATE TAB */}
            <TabsContent value="validate" className="space-y-4">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Validate Channel File</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload a channel JSON file to validate all streams and remove non-working channels.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Upload Channel File
                    </label>
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => setValidationFile(e.target.files?.[0] || null)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>

                  {validationFile && (
                    <div className="p-3 bg-secondary rounded-md">
                      <p className="text-sm font-medium">{validationFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(validationFile.size)}
                      </p>
                    </div>
                  )}

                  <div className="space-y-3 pt-2 border-t">
                    <h4 className="font-medium text-sm">Validation Settings</h4>

                    <div>
                      <label className="block text-sm mb-1">
                        Timeout (seconds): {timeout}
                      </label>
                      <input
                        type="range"
                        min="5"
                        max="30"
                        value={timeout}
                        onChange={(e) => setTimeout(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-1">
                        Parallel checks: {parallel}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        value={parallel}
                        onChange={(e) => setParallel(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-1">
                        Retry attempts: {retry}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={retry}
                        onChange={(e) => setRetry(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleValidateFile}
                    disabled={!validationFile || validationProgress !== null}
                    className="w-full"
                  >
                    {validationProgress !== null ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Validating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Validate Streams
                      </>
                    )}
                  </Button>

                  {validationProgress !== null && (
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${validationProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>

            {/* MERGE TAB */}
            <TabsContent value="merge" className="space-y-4">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Merge Channel Files</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Combine multiple channel files and remove duplicates.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Select Files to Merge ({mergeFiles.length} selected)
                    </label>
                    <div className="border rounded-md p-3 max-h-64 overflow-y-auto space-y-2">
                      {channelFiles.map((file) => (
                        <div key={file.filename} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`merge-${file.filename}`}
                            checked={mergeFiles.includes(file.filename)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setMergeFiles(prev => [...prev, file.filename]);
                              } else {
                                setMergeFiles(prev => prev.filter(f => f !== file.filename));
                              }
                            }}
                            className="rounded"
                          />
                          <label htmlFor={`merge-${file.filename}`} className="text-sm flex-1">
                            {file.filename} ({file.channelCount} channels)
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Deduplicate By
                    </label>
                    <select
                      value={dedupeBy}
                      onChange={(e) => setDedupeBy(e.target.value as any)}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="streamURL">Stream URL (recommended)</option>
                      <option value="name">Channel Name</option>
                      <option value="both">Both Name and URL</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="skipValidationMerge"
                      checked={skipValidation}
                      onChange={(e) => setSkipValidation(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="skipValidationMerge" className="text-sm">
                      Skip validation after merge (faster)
                    </label>
                  </div>

                  <Button
                    onClick={handleMergeFiles}
                    disabled={mergeFiles.length < 2 || currentJob?.status === 'running'}
                    className="w-full"
                  >
                    {currentJob?.status === 'running' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Merging...
                      </>
                    ) : (
                      <>
                        <Merge className="h-4 w-4 mr-2" />
                        Merge {mergeFiles.length} Files
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </TabsContent>

            {/* AI ANALYZE TAB */}
            <TabsContent value="analyze" className="space-y-4">
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <h3 className="text-lg font-semibold">AI Channel Analysis</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Use AI to analyze, filter, edit, and reorganize your channel files with natural language.
                </p>

                {!selectedFileForAI ? (
                  <div className="space-y-4">
                    <label className="block text-sm font-medium mb-2">
                      Select a channel file to analyze
                    </label>
                    <div className="border rounded-md p-3 max-h-96 overflow-y-auto space-y-2">
                      {channelFiles.map((file) => (
                        <div
                          key={file.filename}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                          onClick={() => {
                            setSelectedFileForAI(file.filename);
                            setAiMessages([{
                              id: 'welcome',
                              sender: 'assistant',
                              content: `Selected: **${file.filename}**\n\n📊 **${file.channelCount} channels**\n\nI can help you:\n- Analyze channel statistics and content\n- Filter channels by criteria\n- Edit channel properties\n- Reorganize and categorize\n- Make recommendations\n\nWhat would you like to do?`,
                            }]);
                          }}
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <FileJson className="h-4 w-4 text-muted-foreground" />
                              <p className="text-sm font-medium">{file.filename}</p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {file.channelCount} channels • {formatFileSize(file.size)}
                            </p>
                          </div>
                          <Button size="sm" variant="outline">
                            Select
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-secondary rounded-md">
                      <div>
                        <p className="text-sm font-medium">{selectedFileForAI}</p>
                        <p className="text-xs text-muted-foreground">
                          {channelFiles.find(f => f.filename === selectedFileForAI)?.channelCount || 0} channels
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedFileForAI(null);
                          setAiMessages([]);
                        }}
                      >
                        Change File
                      </Button>
                    </div>

                    {/* Chat Messages */}
                    <div className="border rounded-md p-4 h-96 overflow-y-auto space-y-4">
                      {aiMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] p-3 rounded-lg ${
                              message.sender === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>
                        </div>
                      ))}
                      {isAiLoading && (
                        <div className="flex justify-start">
                          <div className="bg-secondary p-3 rounded-lg">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !isAiLoading) {
                            handleAiAnalyze();
                          }
                        }}
                        placeholder="Ask about channels, filter, edit, or reorganize..."
                        className="flex-1 px-3 py-2 border rounded-md"
                        disabled={isAiLoading}
                      />
                      <Button
                        onClick={handleAiAnalyze}
                        disabled={isAiLoading || !aiPrompt.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Example Prompts */}
                    <div className="border-t pt-4">
                      <p className="text-xs font-medium mb-2">Example prompts:</p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          'Show me statistics about the channels',
                          'Filter to only sports channels',
                          'Remove all channels with invalid URLs',
                          'Group channels by language',
                          'Find duplicate channel names',
                          'Recommend top 50 channels for families',
                        ].map((example) => (
                          <button
                            key={example}
                            onClick={() => setAiPrompt(example)}
                            className="text-xs px-2 py-1 border rounded hover:bg-accent"
                            disabled={isAiLoading}
                          >
                            {example}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* FILES TAB */}
            <TabsContent value="files" className="space-y-4">
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Generated Files</h3>
                  <Button size="sm" variant="outline" onClick={loadChannelFiles}>
                    Refresh
                  </Button>
                </div>

                {channelFiles.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No channel files yet. Generate some channels to get started.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {channelFiles.map((file) => (
                      <div
                        key={file.filename}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <FileJson className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm font-medium">{file.filename}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {file.channelCount} channels • {formatFileSize(file.size)} • {new Date(file.created).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDownload(file.filename)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteFile(file.filename)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right side - Status and Results */}
        <div className="space-y-4">
          {/* Current Job Status */}
          {currentJob && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Current Job</h3>

              {currentJob.status === 'running' && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    <span className="text-sm">{currentJob.progress?.message}</span>
                  </div>
                  {currentJob.progress && (
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${(currentJob.progress.current / currentJob.progress.total) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              {currentJob.status === 'completed' && currentJob.result && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Complete!</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Channels:</span>
                      <span className="font-medium">{currentJob.result.totalChannels}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Valid:</span>
                      <span className="font-medium text-green-600">{currentJob.result.validChannels}</span>
                    </div>
                    {currentJob.result.invalidChannels > 0 && (
                      <div className="flex justify-between">
                        <span>Invalid:</span>
                        <span className="font-medium text-red-600">{currentJob.result.invalidChannels}</span>
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => handleDownload(currentJob.result!.outputFile)}
                    className="w-full mt-2"
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download JSON
                  </Button>
                </div>
              )}

              {currentJob.status === 'failed' && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-red-600">
                    <XCircle className="h-5 w-5" />
                    <span className="font-medium">Failed</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{currentJob.error}</p>
                </div>
              )}
            </Card>
          )}

          {/* Recent Jobs */}
          {jobs.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Jobs</h3>
              <div className="space-y-2">
                {jobs.slice(0, 5).map((job) => (
                  <div key={job.id} className="p-3 border rounded-lg text-sm">
                    {job.status === 'completed' && job.result && (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{job.result.validChannels} channels</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDownload(job.result!.outputFile)}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {job.result.outputFile}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Info Card */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Features</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Generate from 37,000+ channels</li>
              <li>• Validate stream quality</li>
              <li>• Merge multiple files</li>
              <li>• Remove duplicates</li>
              <li>• Custom filtering</li>
              <li className="flex items-center gap-1 text-purple-600">
                <Sparkles className="h-3 w-3" />
                AI-powered analysis & editing
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
