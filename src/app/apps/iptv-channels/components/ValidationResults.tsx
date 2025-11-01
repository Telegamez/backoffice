'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Download, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

interface ValidationResultsProps {
  stats: any;
  onDownload: (filename: string) => void;
}

export default function ValidationResults({ stats, onDownload }: ValidationResultsProps) {
  const [showInvalid, setShowInvalid] = useState(false);

  if (!stats || stats.type !== 'complete') return null;

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const successRate = ((stats.valid / (stats.valid + stats.invalid)) * 100).toFixed(1);

  return (
    <Card className="p-6 border-2 border-green-500">
      <div className="space-y-6">
        {/* Success Header */}
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-green-700 dark:text-green-300">
              Validation Complete!
            </h3>
            <p className="text-sm text-muted-foreground">
              Completed in {formatTime(stats.duration)}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-green-600">
              {successRate}%
            </div>
            <div className="text-xs text-muted-foreground">success rate</div>
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-secondary/30 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold">{stats.valid + stats.invalid}</div>
            <div className="text-xs text-muted-foreground mt-1">Total Tested</div>
          </div>
          <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg text-center border border-green-200 dark:border-green-800">
            <div className="text-2xl font-bold text-green-600">{stats.valid}</div>
            <div className="text-xs text-green-600 mt-1">Valid Channels</div>
          </div>
          <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg text-center border border-red-200 dark:border-red-800">
            <div className="text-2xl font-bold text-red-600">{stats.invalid}</div>
            <div className="text-xs text-red-600 mt-1">Invalid Channels</div>
          </div>
        </div>

        {/* File Info */}
        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Validated File Ready
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-mono">
                {stats.filename}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Contains {stats.valid} working channels
              </p>
            </div>
            <Button onClick={() => onDownload(stats.filename)} size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        {/* Invalid Channels Section (Expandable) */}
        {stats.invalid > 0 && stats.invalidSamples && stats.invalidSamples.length > 0 && (
          <div className="border-t pt-4">
            <button
              onClick={() => setShowInvalid(!showInvalid)}
              className="flex items-center gap-2 text-sm font-medium hover:underline w-full justify-between"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <span>Invalid Channels ({stats.invalid})</span>
                <span className="text-xs text-muted-foreground">
                  - Showing first {Math.min(10, stats.invalidSamples.length)}
                </span>
              </div>
              {showInvalid ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {showInvalid && (
              <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                {stats.invalidSamples.map((channel: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-secondary/50 p-3 rounded text-xs"
                  >
                    <div className="font-medium">{channel.name}</div>
                    <div className="text-muted-foreground mt-1">
                      {channel.Category} • {channel.Language}
                    </div>
                    <div className="text-red-600 dark:text-red-400 mt-1 font-mono text-xs">
                      {channel.error || 'Failed validation'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Performance Stats */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3">Performance Metrics</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration:</span>
              <span className="font-medium">{formatTime(stats.duration)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg. Speed:</span>
              <span className="font-medium">
                {((stats.valid + stats.invalid) / stats.duration).toFixed(1)} ch/s
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Settings:</span>
              <span className="font-medium">
                {stats.metadata?.validation_config?.parallel || 0} parallel
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Timeout:</span>
              <span className="font-medium">
                {stats.metadata?.validation_config?.timeout || 0}s
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
