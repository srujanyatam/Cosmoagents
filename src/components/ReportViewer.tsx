import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Check, AlertTriangle, X, Download, Upload, Database, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ConversionReport } from '@/types';
import { deployToOracle } from '@/utils/databaseUtils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
Chart.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

interface ReportViewerProps {
  report: ConversionReport;
  onBack: () => void;
}

interface DeploymentLog {
  id: string;
  created_at: string;
  status: string;
  lines_of_sql: number;
  file_count: number;
  error_message: string | null;
}

const ReportViewer: React.FC<ReportViewerProps> = ({
  report,
  onBack,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentLogs, setDeploymentLogs] = useState<DeploymentLog[]>([]);
  
  // Fetch deployment logs from Supabase on component mount
  useEffect(() => {
    fetchDeploymentLogs();
    
    // Set up real-time subscription for deployment logs
    const channel = supabase
      .channel('deployment-logs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deployment_logs'
        },
        () => {
          fetchDeploymentLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDeploymentLogs = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('deployment_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching deployment logs:', error);
        return;
      }
      setDeploymentLogs(data || []);
    } catch (error) {
      console.error('Error fetching deployment logs:', error);
    }
  };

  const saveDeploymentLog = async (status: string, linesOfSql: number, fileCount: number, errorMessage?: string) => {
    if (!user) return null;
    try {
      const { data, error } = await supabase
        .from('deployment_logs')
        .insert({
          user_id: user.id,
          status,
          lines_of_sql: linesOfSql,
          file_count: fileCount,
          error_message: errorMessage || null
        })
        .select()
        .single();
      if (error) {
        console.error('Error saving deployment log:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error saving deployment log:', error);
      return null;
    }
  };
  
  const handleDownload = () => {
    // Create a blob with the report content
    const blob = new Blob([report.summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    // Create a link element and trigger the download
    const a = document.createElement('a');
    a.href = url;
    a.download = `oracle-migration-report-${report.timestamp.split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Report Downloaded',
      description: 'The migration report has been downloaded to your device.',
    });
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    try {
      // Calculate lines of SQL and file count from the report
      const linesOfSql = report.summary.split('\n').length;
      const fileCount = report.filesProcessed;
      let allSuccess = true;
      let filesToInsert = [];
      // Fetch latest reviewed files from unreviewed_files
      let latestFiles = [];
      if (user) {
        const { data: unreviewed, error } = await supabase
          .from('unreviewed_files')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'reviewed');
        if (!error && unreviewed && unreviewed.length > 0) {
          latestFiles = unreviewed.map(f => ({
            file_name: f.file_name,
            file_path: f.file_name,
            file_type: (f.file_name.toLowerCase().includes('trig') ? 'trigger' : f.file_name.toLowerCase().includes('proc') ? 'procedure' : f.file_name.toLowerCase().includes('tab') ? 'table' : 'other'),
            converted_content: f.converted_code,
            original_content: f.original_code,
            conversion_status: 'success',
          }));
        }
      }
      if (latestFiles.length > 0) {
        filesToInsert = latestFiles;
      } else {
        // fallback to report.results
        filesToInsert = report.results.map(r => ({
          file_name: r.originalFile.name,
          file_path: r.originalFile.name,
          file_type: r.originalFile.type,
          converted_content: r.convertedCode,
          original_content: r.originalFile.content,
          conversion_status: r.status,
        }));
      }
      // Simulate deployment for each file (replace with real logic as needed)
      for (const file of filesToInsert) {
        const deployResult = await deployToOracle(
          { 
            type: 'oracle',
            host: 'localhost',
            port: '1521',
            username: 'system',
            password: 'password',
            database: 'ORCL'
          },
          file.converted_content
        );
        if (!deployResult.success) allSuccess = false;
      }
      // After deployment, create a migration/project and insert all files into migration_files
      const { data: migration, error: migrationError } = await supabase
        .from('migrations')
        .insert({
          user_id: user?.id,
          project_name: `Oracle Deployment: ${new Date().toLocaleString()}`
        })
        .select()
        .single();
      if (!migrationError && migration) {
        await supabase.from('migration_files').insert(
          filesToInsert.map(f => ({ ...f, migration_id: migration.id }))
        );
        // After inserting into migration_files, delete only reviewed files from unreviewed_files
        await supabase.from('unreviewed_files').delete().eq('user_id', user.id).eq('status', 'reviewed');
      }
      // Save deployment log to Supabase
      const logEntry = await saveDeploymentLog(
        allSuccess ? 'Success' : 'Failed',
        linesOfSql,
        fileCount,
        allSuccess ? undefined : 'One or more files failed to deploy.'
      );
      toast({
        title: allSuccess ? 'Deployment Successful' : 'Deployment Failed',
        description: allSuccess ? 'All files deployed successfully.' : 'Some files failed to deploy.',
        variant: allSuccess ? 'default' : 'destructive',
      });
      if (logEntry) {
        console.log('Deployment log saved:', logEntry);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await saveDeploymentLog(
        'Failed',
        report.summary.split('\n').length,
        report.filesProcessed,
        errorMessage
      );
      toast({
        title: 'Deployment Failed',
        description: 'An unexpected error occurred during deployment.',
        variant: 'destructive',
      });
    } finally {
      setIsDeploying(false);
    }
  };

  // Delete file from database
  const handleDeleteFile = async (fileId: string) => {
    try {
      const { error } = await supabase.from('migration_files').delete().eq('id', fileId);
      if (error) {
        toast({ title: 'Delete Failed', description: 'Could not delete file from database.', variant: 'destructive' });
      } else {
        toast({ title: 'File Deleted', description: 'File deleted from database.' });
        // Optionally refresh the report or file list here
      }
    } catch (error) {
      toast({ title: 'Delete Failed', description: 'An error occurred while deleting the file.', variant: 'destructive' });
    }
  };
  
  // Pie chart data
  const pieData = {
    labels: ['Success', 'Warning', 'Error'],
    datasets: [
      {
        data: [report.successCount, report.warningCount, report.errorCount],
        backgroundColor: ['#22c55e', '#eab308', '#ef4444'],
        borderWidth: 1,
      },
    ],
  };
  const pieOptions = {
    animation: { animateRotate: true, duration: 1200 },
    plugins: { legend: { display: true, position: 'bottom' as 'bottom' } },
    cutout: '60%',
  };
  // Pagination state for bar chart
  const [barPage, setBarPage] = useState(0);
  const filesPerPage = 10;
  const totalPages = Math.ceil(report.results.length / filesPerPage);
  const pagedResults = report.results.slice(barPage * filesPerPage, (barPage + 1) * filesPerPage);
  const fileNames = pagedResults.map(r => r.originalFile.name);
  const beforeLines = pagedResults.map(r => r.performance?.originalLines || 0);
  const afterLines = pagedResults.map(r => r.performance?.convertedLines || 0);
  const barData = {
    labels: fileNames,
    datasets: [
      {
        label: 'Before Migration',
        data: beforeLines,
        backgroundColor: '#60a5fa',
      },
      {
        label: 'After Migration',
        data: afterLines,
        backgroundColor: '#22d3ee',
      },
    ],
  };
  const barOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as 'top' },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            if (label === 'Before Migration') {
              return `Before Migration (Sybase): ${value} lines`;
            } else if (label === 'After Migration') {
              return `After Migration (Oracle): ${value} lines`;
            }
            return `${label}: ${value}`;
          }
        }
      },
    },
    animation: { duration: 1200 },
    scales: {
      y: {
        title: {
          display: true,
          text: 'Lines of Code',
        },
        beginAtZero: true,
      },
    },
  };
  // Download handlers
  const handleDownloadTxt = () => {
    const blob = new Blob([report.summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `oracle-migration-report-${report.timestamp.split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Report Downloaded', description: 'TXT report downloaded.' });
  };
  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    doc.text('Oracle Migration Report', 10, 10);
    doc.text(report.summary, 10, 20);
    doc.save(`oracle-migration-report-${report.timestamp.split('T')[0]}.pdf`);
    toast({ title: 'Report Downloaded', description: 'PDF report downloaded.' });
  };
  const handleDownloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(report.results.map(r => ({
      File: r.originalFile.name,
      Type: r.originalFile.type,
      Status: r.status,
      Issues: r.issues?.length || 0,
      'Before Lines': r.performance?.originalLines || 0,
      'After Lines': r.performance?.convertedLines || 0,
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `oracle-migration-report-${report.timestamp.split('T')[0]}.xlsx`);
    toast({ title: 'Report Downloaded', description: 'Excel report downloaded.' });
  };
  
  // Compute summary stats
  const totalManualEdits = report.results.filter(r => Boolean((r as any).manualEdits)).length;
  const avgComplexityChange = report.results.length > 0 ? (
    report.results.reduce((sum, r) => sum + (((r.performance && 'complexityAfter' in r.performance ? (r.performance as any).complexityAfter : 0) - (r.performance && 'complexityBefore' in r.performance ? (r.performance as any).complexityBefore : 0))), 0) / report.results.length
  ).toFixed(2) : '0';
  // Pagination for complexity and comment ratio charts
  const [complexityPage, setComplexityPage] = useState(0);
  const complexityPagedResults = report.results.slice(complexityPage * filesPerPage, (complexityPage + 1) * filesPerPage);
  const complexityNames = complexityPagedResults.map(r => r.originalFile.name);
  const complexityBefore = complexityPagedResults.map(r => r.performance && 'complexityBefore' in r.performance ? (r.performance as any).complexityBefore : 0);
  const complexityAfter = complexityPagedResults.map(r => r.performance && 'complexityAfter' in r.performance ? (r.performance as any).complexityAfter : 0);
  const complexityBarData = {
    labels: complexityNames,
    datasets: [
      { label: 'Before Migration', data: complexityBefore, backgroundColor: '#fbbf24' },
      { label: 'After Migration', data: complexityAfter, backgroundColor: '#6366f1' },
    ],
  };
  const [commentPage, setCommentPage] = useState(0);
  const commentPagedResults = report.results.slice(commentPage * filesPerPage, (commentPage + 1) * filesPerPage);
  const commentNames = commentPagedResults.map(r => r.originalFile.name);
  const commentBefore = commentPagedResults.map(r => r.performance && 'commentRatioBefore' in r.performance ? (r.performance as any).commentRatioBefore : 0);
  const commentAfter = commentPagedResults.map(r => r.performance && 'commentRatioAfter' in r.performance ? (r.performance as any).commentRatioAfter : 0);
  const commentBarData = {
    labels: commentNames,
    datasets: [
      { label: 'Before Migration', data: commentBefore, backgroundColor: '#f472b6' },
      { label: 'After Migration', data: commentAfter, backgroundColor: '#34d399' },
    ],
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-2xl">Migration Report</CardTitle>
              <CardDescription>
                {new Date(report.timestamp).toLocaleString()} &bull; {report.filesProcessed} files processed
              </CardDescription>
              <div className="flex flex-row gap-3 mt-2">
                <Badge className="flex items-center gap-1 bg-green-100 text-green-700"><Check className="h-4 w-4" /> {report.successCount} Success</Badge>
                <Badge className="flex items-center gap-1 bg-yellow-100 text-yellow-700"><AlertTriangle className="h-4 w-4" /> {report.warningCount} Warning</Badge>
                <Badge className="flex items-center gap-1 bg-red-100 text-red-700"><X className="h-4 w-4" /> {report.errorCount} Error</Badge>
                <Badge className="flex items-center gap-1 bg-blue-100 text-blue-700"><span className="font-bold">{totalManualEdits}</span> Manual Edits</Badge>
                <Badge className="flex items-center gap-1 bg-purple-100 text-purple-700"><span className="font-bold">{avgComplexityChange}</span> Avg. Complexity Δ</Badge>
              </div>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <div className="flex gap-2">
                <Button onClick={handleDownloadTxt} className="flex items-center gap-2" size="sm">TXT</Button>
                <Button onClick={handleDownloadPdf} className="flex items-center gap-2" size="sm">PDF</Button>
                <Button onClick={handleDownloadExcel} className="flex items-center gap-2" size="sm">Excel</Button>
              </div>
              <Button onClick={handleDownload} className="flex items-center gap-2 mt-1">
                <Download className="h-4 w-4" /> Download Full Report
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
              <h3 className="text-base font-semibold mb-2">Status Distribution</h3>
              <Pie data={pieData} options={pieOptions} style={{ maxWidth: 220 }} />
            </div>
            <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
              <h3 className="text-base font-semibold mb-2">Performance Improvements</h3>
              <span className="text-xs text-gray-500 mb-2">Before = Sybase, After = Oracle (Lines of Code)</span>
              <Bar data={barData} options={barOptions} style={{ maxHeight: 220 }} />
              {totalPages > 1 && (
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" onClick={() => setBarPage(barPage - 1)} disabled={barPage === 0}>Prev</Button>
                  <span className="text-xs text-gray-500">Page {barPage + 1} of {totalPages}</span>
                  <Button size="sm" variant="outline" onClick={() => setBarPage(barPage + 1)} disabled={barPage === totalPages - 1}>Next</Button>
                </div>
              )}
            </div>
            <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
              <h3 className="text-base font-semibold mb-2">Cyclomatic Complexity</h3>
              <span className="text-xs text-gray-500 mb-2">Before = Sybase, After = Oracle (Complexity Score)</span>
              <Bar data={complexityBarData} options={barOptions} style={{ maxHeight: 220 }} />
              {totalPages > 1 && (
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" onClick={() => setComplexityPage(complexityPage - 1)} disabled={complexityPage === 0}>Prev</Button>
                  <span className="text-xs text-gray-500">Page {complexityPage + 1} of {totalPages}</span>
                  <Button size="sm" variant="outline" onClick={() => setComplexityPage(complexityPage + 1)} disabled={complexityPage === totalPages - 1}>Next</Button>
                </div>
              )}
            </div>
            <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
              <h3 className="text-base font-semibold mb-2">Comment Ratio</h3>
              <span className="text-xs text-gray-500 mb-2">Before = Sybase, After = Oracle (% of lines that are comments)</span>
              <Bar data={commentBarData} options={barOptions} style={{ maxHeight: 220 }} />
              {totalPages > 1 && (
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" onClick={() => setCommentPage(commentPage - 1)} disabled={commentPage === 0}>Prev</Button>
                  <span className="text-xs text-gray-500">Page {commentPage + 1} of {totalPages}</span>
                  <Button size="sm" variant="outline" onClick={() => setCommentPage(commentPage + 1)} disabled={commentPage === totalPages - 1}>Next</Button>
                </div>
              )}
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Full Report</h3>
            <div className="bg-slate-50 dark:bg-slate-900 border rounded-md">
              <ScrollArea className="h-[300px] p-4">
                <pre className="text-sm whitespace-pre-wrap font-mono text-slate-800 dark:text-slate-200">
                  {report.summary}
                </pre>
              </ScrollArea>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium">Deployment Logs</h3>
              <Button 
                onClick={handleDeploy} 
                disabled={isDeploying}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {isDeploying ? 'Deploying...' : 'Deploy to Oracle'}
              </Button>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 border rounded-md">
              <ScrollArea className="h-[300px] p-4">
                {deploymentLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Database className="h-16 w-16 mb-2 opacity-20" />
                    <p>No deployment logs yet. Click "Deploy to Oracle" to update the database.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {deploymentLogs.map((log) => (
                      <div key={log.id} className="border rounded-lg p-4 bg-white dark:bg-slate-800">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={log.status === 'Success' ? 'default' : 'destructive'}>
                              {log.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              ID: {log.id.slice(0, 8)}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Files: </span>
                            <span>{log.file_count}</span>
                          </div>
                          <div>
                            <span className="font-medium">Lines of SQL: </span>
                            <span>{log.lines_of_sql}</span>
                          </div>
                        </div>
                        {log.error_message && (
                          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-700 dark:text-red-300">
                            <span className="font-medium">Error: </span>
                            <span>{log.error_message}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </CardContent>
        
        <CardFooter>
          <div className="w-full flex justify-between items-center">
            <Button variant="outline" className="flex items-center gap-2" onClick={onBack}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Back
            </Button>
            <Button onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ReportViewer;
