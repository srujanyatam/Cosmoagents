
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';
import FileTreeView from '@/components/FileTreeView';
import ConversionViewer from '@/components/ConversionViewer';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

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

interface ConversionPanelProps {
  files: FileItem[];
  selectedFile: FileItem | null;
  isConverting: boolean;
  convertingFileIds: string[];
  onFileSelect: (file: FileItem) => void;
  onConvertFile: (fileId: string) => void;
  onConvertAllByType: (type: 'table' | 'procedure' | 'trigger' | 'other') => void;
  onConvertAll: () => void;
  onFixFile: (fileId: string) => void;
  onManualEdit: (newContent: string) => void;
  onDismissIssue: (issueId: string) => void;
  onGenerateReport: () => void;
  onUploadRedirect: () => void;
  onClear: () => void;
  onMoveToDevReview: () => void;
  canCompleteMigration: boolean;
}

const ConversionPanel: React.FC<ConversionPanelProps> = ({
  files,
  selectedFile,
  isConverting,
  convertingFileIds,
  onFileSelect,
  onConvertFile,
  onConvertAllByType,
  onConvertAll,
  onFixFile,
  onManualEdit,
  onDismissIssue,
  onGenerateReport,
  onUploadRedirect,
  onClear,
  onMoveToDevReview,
  canCompleteMigration,
}) => {
  if (files.length === 0) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>No Files Uploaded</CardTitle>
          <CardDescription>
            Please upload your Sybase code files first to begin the conversion process.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onUploadRedirect}>
            Upload Files
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Compute filtered file list for navigation (should match FileTreeView's filter logic)
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('All');
  const [selectedFileIds, setSelectedFileIds] = React.useState<string[]>([]);
  const [showResetDialog, setShowResetDialog] = React.useState(false);
  const [isBatchConverting, setIsBatchConverting] = React.useState(false);
  const [batchProgress, setBatchProgress] = React.useState<number>(0);

  const handleBatchConvert = async () => {
    setIsBatchConverting(true);
    setBatchProgress(0);
    const batchSize = 5;
    for (let i = 0; i < selectedFileIds.length; i += batchSize) {
      const batch = selectedFileIds.slice(i, i + batchSize);
      // Convert all files in the batch in parallel
      await Promise.all(batch.map(fileId => Promise.resolve(onConvertFile(fileId))));
      setBatchProgress(i + batch.length);
      if (i + batchSize < selectedFileIds.length) {
        await new Promise(res => setTimeout(res, 2000)); // 2 second gap between batches
      }
    }
    setIsBatchConverting(false);
  };

  const handleResetMigration = () => {
    // This function will be implemented in a future edit to handle resetting migration
    console.log('Reset migration');
    setShowResetDialog(false);
    onUploadRedirect();
  };

  // Helper for progress/estimate
  const isBatchMode = selectedFileIds.length > 0;
  const filesForProgress = isBatchMode ? files.filter(f => selectedFileIds.includes(f.id)) : files;
  const totalToConvert = isBatchMode ? selectedFileIds.length : files.length;
  const convertedCount = filesForProgress.filter(f => f.conversionStatus === 'success').length;
  const inProgressCount = convertingFileIds.filter(id => filesForProgress.some(f => f.id === id)).length;
  const percent = totalToConvert > 0 ? Math.round(((convertedCount + inProgressCount) / totalToConvert) * 100) : 0;
  const filesRemaining = totalToConvert - convertedCount - inProgressCount;
  const avgTimePerFile = 6; // seconds, more realistic
  const estimatedTime = filesRemaining > 0 ? filesRemaining * avgTimePerFile : 0;
  function formatTime(sec: number) {
    if (sec <= 0) return '0s';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  }

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'All' ? true :
      statusFilter === 'Pending' ? file.conversionStatus === 'pending' :
      statusFilter === 'Success' ? file.conversionStatus === 'success' :
      statusFilter === 'Failed' ? file.conversionStatus === 'failed' : true;
    return matchesSearch && matchesStatus;
  });
  // Group filtered files by type to match sidebar order
  const filteredTables = filteredFiles.filter(f => f.type === 'table');
  const filteredProcedures = filteredFiles.filter(f => f.type === 'procedure');
  const filteredTriggers = filteredFiles.filter(f => f.type === 'trigger');
  const filteredOther = filteredFiles.filter(f => f.type === 'other');
  const allFilteredFiles = [
    ...filteredTables,
    ...filteredProcedures,
    ...filteredTriggers,
    ...filteredOther
  ];
  const currentIndex = allFilteredFiles.findIndex(f => f.id === selectedFile?.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < allFilteredFiles.length - 1;

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-4">
        {/* Move buttons above file sections */}
        <div className="flex flex-row gap-2 mb-2 items-center justify-start">
          <Button
            size="sm"
            onClick={handleBatchConvert}
            disabled={isConverting || isBatchConverting || selectedFileIds.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1"
          >
            {isBatchConverting ? `Converting... (${batchProgress}/${selectedFileIds.length})` : `Convert Selected (${selectedFileIds.length})`}
          </Button>
          <Button 
            size="sm"
            variant="destructive" 
            onClick={() => setShowResetDialog(true)} 
            className="px-3 py-1"
          >
            Reset Migration
          </Button>
        </div>
        <div className="flex flex-col items-end min-w-[120px] bg-white/90 border border-gray-200 rounded p-3 mb-2 w-full shadow-md">
          <Progress value={percent} className="h-3 w-full mb-2 transition-all duration-1000 shadow-inner" />
          <div className="flex justify-between items-center w-full">
            <span className="text-xs text-gray-700 font-medium">{percent}%</span>
            <span className="text-xs text-gray-500">{totalToConvert > 0 ? `Est: ${formatTime(estimatedTime)}` : 'No files selected'}</span>
          </div>
        </div>
        <FileTreeView
          files={files}
          onFileSelect={onFileSelect}
          onConvertFile={onConvertFile}
          onConvertAllByType={onConvertAllByType}
          onConvertAll={onConvertAll}
          onFixFile={onFixFile}
          selectedFile={selectedFile}
          isConverting={isConverting || isBatchConverting}
          convertingFileIds={convertingFileIds.concat(isBatchConverting ? selectedFileIds : [])}
          hideActions={false}
          defaultExpandedSections={['tables','procedures','triggers']}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          onSearchTermChange={setSearchTerm}
          onStatusFilterChange={setStatusFilter}
          onSelectedFilesChange={setSelectedFileIds}
          onResetMigration={handleResetMigration}
        />
        <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Migration?</DialogTitle>
            </DialogHeader>
            <div className="py-2">Are you sure you want to reset the current migration? This will clear all uploaded files and progress.</div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowResetDialog(false)}>Cancel</Button>
              <Button variant="destructive" onClick={() => { setShowResetDialog(false); onUploadRedirect(); }}>OK</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="col-span-8">
        {selectedFile ? (
          <>
            <ConversionViewer
              file={selectedFile}
              onManualEdit={onManualEdit}
              onDismissIssue={onDismissIssue}
              hideEdit={true}
              onPrevFile={hasPrev ? () => onFileSelect(allFilteredFiles[currentIndex - 1]) : undefined}
              onNextFile={hasNext ? () => onFileSelect(allFilteredFiles[currentIndex + 1]) : undefined}
              hasPrev={hasPrev}
              hasNext={hasNext}
            />
            {files.some(f => f.conversionStatus === 'success') && (
              <div className="flex justify-end gap-2 mt-4">
                <Button 
                  onClick={onMoveToDevReview}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Move to Dev Review
                </Button>
                <Button 
                  onClick={onGenerateReport}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={!canCompleteMigration}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Complete Migration
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card className="h-full flex items-center justify-center">
            <CardContent className="text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Select a file to view
              </h3>
              <p className="text-gray-600">
                Choose a file from the list to see its details
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ConversionPanel;
