
import React, { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, FileText, Upload, Clock, BarChart3 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { ConversionResult, ConversionReport } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

import CodeUploader from '@/components/CodeUploader';
import ReportViewer from '@/components/ReportViewer';
import Help from '@/components/Help';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import ConversionPanel from '@/components/dashboard/ConversionPanel';
import DevReviewPanel from '@/components/PendingActionsPanel';
import PerformanceMetricsDashboard from '@/components/PerformanceMetricsDashboard';
import { useConversionLogic } from '@/components/dashboard/ConversionLogic';
import { useMigrationManager } from '@/components/dashboard/MigrationManager';
import { useUnreviewedFiles } from '@/hooks/useUnreviewedFiles';
import { isCacheEnabled, setCacheEnabled } from '@/utils/conversionUtils';

interface FileItem {
  id: string;
  name: string;
  path: string;
  type: 'table' | 'procedure' | 'trigger' | 'other';
  content: string;
  conversionStatus: 'pending' | 'success' | 'failed';
  convertedContent?: string;
  errorMessage?: string;
  dataTypeMapping?: any[];
  issues?: any[];
  performanceMetrics?: any;
}

const Dashboard = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const initialTab = (location.state?.activeTab as 'upload' | 'conversion' | 'devReview' | 'metrics') || 'upload';
  
  const [activeTab, setActiveTab] = useState<'upload' | 'conversion' | 'devReview' | 'metrics'>(initialTab);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [conversionResults, setConversionResults] = useState<ConversionResult[]>([]);
  const [selectedAiModel, setSelectedAiModel] = useState<string>('gemini-2.5-pro');
  const [showHelp, setShowHelp] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingCompleteMigration, setPendingCompleteMigration] = useState(false);
  const [cacheEnabled, setCacheEnabledState] = useState(isCacheEnabled());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const conversionTabRef = useRef<HTMLDivElement>(null);

  const handleToggleCache = () => {
    setCacheEnabled(!cacheEnabled);
    setCacheEnabledState(!cacheEnabled);
  };

  const { handleCodeUpload } = useMigrationManager();
  const {
    unreviewedFiles,
    addUnreviewedFile,
    refreshUnreviewedFiles,
    isLoading,
    markAsReviewed,
    deleteUnreviewedFile,
    updateUnreviewedFile
  } = useUnreviewedFiles();
  const {
    isConverting,
    convertingFileIds,
    handleConvertFile,
    handleConvertAllByType,
    handleConvertAll,
    handleFixFile,
    handleGenerateReport,
  } = useConversionLogic(files, setFiles, setConversionResults, selectedAiModel);

  // Enable Complete Migration in Conversion tab if there is at least one successfully converted file
  const canCompleteMigration = activeTab === 'conversion'
    ? files.some(f => f.conversionStatus === 'success')
    : unreviewedFiles.filter(f => f.status === 'reviewed').length > 0;

  // Add a callback to refresh unreviewed files after a file is reviewed
  const handleFileReviewed = async () => {
    await refreshUnreviewedFiles();
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (files.length > 0 && !selectedFile) {
      const firstConvertedFile = files.find(f => f.convertedContent);
      setSelectedFile(firstConvertedFile || files[0]);
    }
  }, [files, selectedFile]);

  useEffect(() => {
    if (selectedFile && files.length > 0) {
      const updated = files.find(f => f.id === selectedFile.id);
      if (updated && updated !== selectedFile) {
        setSelectedFile(updated);
      }
    }
  }, [files, selectedFile]);

  useEffect(() => {
    // Restore conversion results and files if coming from report page
    if (location.state?.activeTab === 'conversion' && location.state?.recentReport) {
      const report = location.state.recentReport;
      setConversionResults(report.results || []);
      // Optionally, set files if your FileItem structure matches ConversionResult.originalFile
      setFiles(report.results.map((r: any) => ({
        ...r.originalFile,
        convertedContent: r.convertedCode,
        conversionStatus: r.status,
        errorMessage: r.errorMessage,
        dataTypeMapping: r.dataTypeMapping,
        issues: r.issues,
        performanceMetrics: r.performanceMetrics,
      })));
      setActiveTab('conversion');
    }
  }, [location.state]);

  useEffect(() => {
    // When switching to Dev Review, update conversionResults from unreviewedFiles
    if (activeTab === 'devReview' && unreviewedFiles.length > 0) {
      setConversionResults(
        unreviewedFiles.map(f => ({
          id: f.id || uuidv4(),
          originalFile: {
            id: f.id || uuidv4(),
            name: f.file_name,
            content: f.original_code,
            type: (f.file_name.toLowerCase().includes('trig') ? 'trigger' : f.file_name.toLowerCase().includes('proc') ? 'procedure' : f.file_name.toLowerCase().includes('tab') ? 'table' : 'other'),
            status: 'success',
          },
          aiGeneratedCode: f.ai_generated_code || f.converted_code || '', // Use DB field
          convertedCode: f.converted_code,
          issues: f.issues || [],
          dataTypeMapping: f.data_type_mapping || [],
          performance: f.performance_metrics || {},
          status: 'success',
          explanations: [],
        }))
      );
    }
  }, [activeTab, unreviewedFiles]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((activeTab === 'conversion' || activeTab === 'devReview') && e.shiftKey && e.key.toLowerCase() === 'f') {
        setIsFullscreen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  // Exit fullscreen if user leaves conversion or devReview tab
  useEffect(() => {
    if ((activeTab !== 'conversion' && activeTab !== 'devReview') && isFullscreen) {
      setIsFullscreen(false);
    }
  }, [activeTab, isFullscreen]);

  const handleDeleteFiles = (fileIds: string[]) => {
    setFiles(prevFiles => prevFiles.filter(file => !fileIds.includes(file.id)));
  };

  const handleCodeUploadWrapper = async (uploadedFiles: any[]) => {
    const convertedFiles = await handleCodeUpload(uploadedFiles);
    setFiles(convertedFiles);
    setActiveTab('conversion');
  };

  const handleFileSelect = (file: FileItem) => {
    setSelectedFile(file);
  };

  const handleDismissIssue = (issueId: string) => {
    if (!selectedFile) return;
    const fileIdx = files.findIndex(f => f.id === selectedFile.id);
    if (fileIdx === -1) return;
    const updatedIssues = selectedFile.issues?.filter(i => i.id !== issueId) || [];
    setFiles(prevFiles => prevFiles.map((f, idx) =>
      idx === fileIdx
        ? { ...f, issues: updatedIssues }
        : f
    ));
    setSelectedFile(prev => prev && prev.id === selectedFile.id
      ? { ...prev, issues: updatedIssues }
      : prev
    );
  };

  const handleManualEdit = (newContent: string) => {
    if (selectedFile) {
      const updatedFile = { ...selectedFile, convertedContent: newContent };
      setFiles(prevFiles =>
        prevFiles.map(file =>
          file.id === selectedFile.id
            ? updatedFile
            : file
        )
      );
      setSelectedFile(updatedFile);
      // Also update conversionResults for real-time metrics
      setConversionResults(prevResults =>
        prevResults.map(result =>
          result.id === selectedFile.id
            ? {
                ...result,
                convertedCode: newContent,
                // Optionally recalculate manual edits or other metrics here
              }
            : result
        )
      );
    }
  };

  const handleGenerateReportWrapper = async () => {
    try {
      const newReport = await handleGenerateReport();
      navigate(`/report/${newReport.id}`);
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Report Generation Failed",
        description: "Failed to generate the conversion report",
        variant: "destructive",
      });
    }
  };

  const handleGoToHistory = () => {
    navigate('/history', { state: { returnTab: activeTab } });
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleResetAndUpload = () => {
    setFiles([]);
    setSelectedFile(null);
    setConversionResults([]);
    setActiveTab('upload');
  };

  const handleMoveToDevReview = async () => {
    // Add all files in conversion to Dev Review (unreviewed_files)
    for (const file of files) {
      if (file.content && file.convertedContent) {
        await addUnreviewedFile({
          file_name: file.name,
          converted_code: file.convertedContent,
          ai_generated_code: (file as any).aiGeneratedCode || file.convertedContent, // Store original AI output
          original_code: file.content,
          data_type_mapping: file.dataTypeMapping,
          issues: file.issues,
          performance_metrics: file.performanceMetrics || {},
        });
      }
    }
    // Clear conversion files
    setFiles([]);
    setSelectedFile(null);
    setConversionResults([]);
    setActiveTab('devReview');
  };

  const handleCompleteMigration = async () => {
    // No confirmation popup or pending state
    try {
      // Refresh the list to get the latest reviewed files
      await refreshUnreviewedFiles();
      // If in Dev Review, use unreviewedFiles for the report
      let reportResults = [];
      if (activeTab === 'devReview') {
        // Only include reviewed files in the report
        reportResults = unreviewedFiles
          .filter(f => f.status === 'reviewed')
          .map(f => ({
            id: f.id || uuidv4(),
            originalFile: {
              id: f.id || uuidv4(),
              name: f.file_name,
              content: f.original_code,
              type: (f.file_name.toLowerCase().includes('trig') ? 'trigger' : f.file_name.toLowerCase().includes('proc') ? 'procedure' : f.file_name.toLowerCase().includes('tab') ? 'table' : 'other'),
              status: 'success',
            },
            aiGeneratedCode: (f as any).aiGeneratedCode || f.converted_code || '', // Preserve if exists, fallback for legacy
            convertedCode: f.converted_code,
            issues: f.issues || [],
            dataTypeMapping: f.data_type_mapping || [],
            performance: f.performance_metrics || {},
            status: 'success',
            explanations: [],
          }));
      } else {
        // fallback to files state (conversion tab)
        reportResults = files.map(file => ({
          id: file.id,
          originalFile: {
            id: file.id,
            name: file.name,
            content: file.content,
            type: file.type,
            status: 'success',
          },
          aiGeneratedCode: (file as any).aiGeneratedCode || file.convertedContent || '', // Preserve if exists, fallback for legacy
          convertedCode: file.convertedContent || '',
          issues: file.issues || [],
          dataTypeMapping: file.dataTypeMapping || [],
          performance: file.performanceMetrics || {},
          status: file.conversionStatus === 'success' ? 'success' : file.conversionStatus === 'failed' ? 'error' : 'warning',
          explanations: [],
        }));
      }
      // Generate summary
      const reportSummary = (await import('@/utils/componentUtilswithlangchain')).generateBalancedConversionReport(reportResults);
      const report = {
        timestamp: new Date().toISOString(),
        filesProcessed: reportResults.length,
        successCount: reportResults.filter(r => r.status === 'success').length,
        warningCount: reportResults.filter(r => r.status === 'warning').length,
        errorCount: reportResults.filter(r => r.status === 'error').length,
        results: reportResults,
        summary: reportSummary,
      };
      // Save to Supabase migration_reports
      const { data, error } = await (await import('@/integrations/supabase/client')).supabase
        .from('migration_reports')
        .insert({
          user_id: profile?.id,
          report: report,
        })
        .select()
        .single();
      if (error) throw error;

      // After saving the report, move all files to history and remove from unreviewed_files
      // (No longer add files to migrations/migration_files here. This is now done after deployment to Oracle.)
      navigate(`/report/${data.id}`);
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Report Generation Failed",
        description: "Failed to generate the conversion report",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Database className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {!isFullscreen && (
        <DashboardHeader
          onGoToHistory={handleGoToHistory}
          onGoHome={handleGoHome}
          onShowHelp={() => setShowHelp(true)}
        />
      )}
      <main className={isFullscreen ? '' : 'container mx-auto px-4 py-8'}>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'upload' | 'conversion' | 'devReview' | 'metrics')}>
          <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto mb-8">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Code
            </TabsTrigger>
            <TabsTrigger value="conversion" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Conversion
            </TabsTrigger>
            <TabsTrigger value="devReview" className="flex items-center gap-2 relative">
              <Clock className="h-4 w-4" />
              Dev Review
              {unreviewedFiles.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {unreviewedFiles.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <CodeUploader onComplete={handleCodeUploadWrapper} />
          </TabsContent>

          <TabsContent value="conversion">
            <div
              ref={conversionTabRef}
              className={isFullscreen ?
                'fixed inset-0 z-50 bg-white dark:bg-slate-900 overflow-auto flex flex-col' :
                ''
              }
              style={isFullscreen ? { width: '100vw', height: '100vh', padding: 0, margin: 0 } : {}}
            >
              <ConversionPanel
                files={files}
                selectedFile={selectedFile}
                isConverting={isConverting}
                convertingFileIds={convertingFileIds}
                onFileSelect={handleFileSelect}
                onConvertFile={handleConvertFile}
                onConvertAllByType={handleConvertAllByType}
                onConvertAll={handleConvertAll}
                onFixFile={handleFixFile}
                onManualEdit={handleManualEdit}
                onDismissIssue={handleDismissIssue}
                onGenerateReport={handleGenerateReportWrapper}
                onUploadRedirect={handleResetAndUpload}
                onClear={handleResetAndUpload}
                onMoveToDevReview={handleMoveToDevReview}
                canCompleteMigration={canCompleteMigration}
                onDeleteFiles={handleDeleteFiles}
                forceMinimized={isFullscreen}
              />
              {/* No fullscreen exit button */}
            </div>
          </TabsContent>

          <TabsContent value="metrics">
            {conversionResults.length > 0 ? (
              <PerformanceMetricsDashboard results={conversionResults} />
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Performance Data Available</h3>
                <p className="text-gray-500 mb-4">
                  Convert some files first to see performance metrics and optimizations.
                </p>
                <button
                  onClick={() => setActiveTab('conversion')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Go to Conversion
                </button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="devReview">
            <div
              className={isFullscreen ?
                'fixed inset-0 z-50 bg-white dark:bg-slate-900 overflow-auto flex flex-col' :
                ''
              }
              style={isFullscreen ? { width: '100vw', height: '100vh', padding: 0, margin: 0 } : {}}
            >
              <DevReviewPanel
                canCompleteMigration={canCompleteMigration}
                onCompleteMigration={() => { handleCompleteMigration(); }}
                onFileReviewed={handleFileReviewed}
                unreviewedFiles={unreviewedFiles}
                isLoading={isLoading}
                markAsReviewed={markAsReviewed}
                deleteUnreviewedFile={deleteUnreviewedFile}
                updateUnreviewedFile={updateUnreviewedFile}
                refreshUnreviewedFiles={refreshUnreviewedFiles}
                forceMinimized={isFullscreen}
              />
              {/* No fullscreen exit button */}
            </div>
          </TabsContent>
        </Tabs>
      </main>
      {showHelp && (
        <Help onClose={() => setShowHelp(false)} />
      )}
      {!isFullscreen && (
        <footer className="w-full text-center py-4 text-gray-500 text-sm border-t bg-white/80 mt-8">
          © 2025 Migration Platform. All rights reserved. Developed by CosmoAgents | <a href="https://www.github.com/mouktikzz/oracle-ai-migrate" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>GitHub</a>
        </footer>
      )}
    </div>
  );
};

export default Dashboard;
