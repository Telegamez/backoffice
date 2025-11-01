'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2, Clock, Zap, TrendingUp } from 'lucide-react';

interface ValidationProgressProps {
  stats: any;
  progress: number | null;
}

export default function ValidationProgress({ stats, progress }: ValidationProgressProps) {
  if (!stats) return null;

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <Card className="p-6 border-2 border-blue-500">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-4 w-4 bg-blue-600 rounded-full animate-pulse" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold">Validating Channels</h3>
              <p className="text-sm text-muted-foreground">
                Testing stream availability...
              </p>
            </div>
          </div>
          {stats.type === 'progress' && (
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">
                {Math.round(stats.progress)}%
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.processed} / {stats.total}
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {progress !== null && (
          <div className="space-y-2">
            <div className="w-full bg-secondary rounded-full h-4 overflow-hidden relative">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-500 ease-out relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white opacity-20 animate-pulse" />
              </div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Starting...</span>
              <span>In Progress</span>
              <span>Complete</span>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        {stats.type === 'progress' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Valid Channels */}
            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-xs font-medium text-green-900 dark:text-green-100">
                  Valid
                </span>
              </div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {stats.valid}
              </div>
              <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                {((stats.valid / stats.processed) * 100).toFixed(1)}% success
              </div>
            </div>

            {/* Invalid Channels */}
            <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-xs font-medium text-red-900 dark:text-red-100">
                  Invalid
                </span>
              </div>
              <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                {stats.invalid}
              </div>
              <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                {((stats.invalid / stats.processed) * 100).toFixed(1)}% failed
              </div>
            </div>

            {/* Time Elapsed */}
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-900 dark:text-blue-100">
                  Elapsed
                </span>
              </div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {formatTime(stats.elapsed)}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                {stats.rate.toFixed(1)} ch/s
              </div>
            </div>

            {/* Time Remaining */}
            <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span className="text-xs font-medium text-purple-900 dark:text-purple-100">
                  Remaining
                </span>
              </div>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {formatTime(stats.remaining)}
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                ~{stats.total - stats.processed} channels
              </div>
            </div>
          </div>
        )}

        {/* Estimation (Start Phase) */}
        {stats.type === 'start' && (
          <div className="bg-secondary/50 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-yellow-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Initializing Validation</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Testing {stats.totalChannels} channels with {stats.settings.parallel} parallel checks
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  <strong>Estimated time:</strong> ~{formatTime(stats.estimatedTime)}
                  {' '}(timeout: {stats.settings.timeout}s, retry: {stats.settings.retry})
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Live Status Messages */}
        {stats.type === 'progress' && (
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-muted-foreground">
                {stats.processed === stats.total
                  ? 'Finalizing results...'
                  : `Processing channel ${stats.processed} of ${stats.total}...`
                }
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
