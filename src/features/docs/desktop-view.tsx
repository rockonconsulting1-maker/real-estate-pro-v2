import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sb } from '@/lib/queryKeys';
import { docsService, DocumentRecord } from '@/lib/supabase/storage';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Upload, File, MoreVertical, Download, Edit2, Trash2, Folder, FileText, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const CATEGORIES = [
  'All',
  'Listing Agreements',
  'Offer Docs',
  'Inspection Reports',
  'Client Files',
  'MLS Sheets',
];

export function DesktopDocsView() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const [renameDoc, setRenameDoc] = useState<DocumentRecord | null>(null);
  const [newName, setNewName] = useState('');

  const { data: documents = [], isLoading } = useQuery({
    queryKey: sb.docs({ category, search }),
    queryFn: () => docsService.listDocuments({ category, search }),
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      return docsService.uploadFile(file, {
        category: category === 'All' ? 'Client Files' : category,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sb.docs() });
      toast.success('Document uploaded successfully');
      setIsUploading(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upload document');
      setIsUploading(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (doc: DocumentRecord) => docsService.deleteDocument(doc),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sb.docs() });
      toast.success('Document deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete document');
    }
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string, name: string }) => docsService.renameDocument(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sb.docs() });
      toast.success('Document renamed');
      setRenameDoc(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to rename document');
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      uploadMutation.mutate(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownload = async (doc: DocumentRecord) => {
    try {
      const url = await docsService.getDownloadUrl(doc);
      window.open(url, '_blank');
    } catch (error: any) {
      toast.error(error.message || 'Failed to get download link');
    }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (mime: string | null) => {
    if (mime?.startsWith('image/')) return <ImageIcon className="h-5 w-5 text-blue-500" />;
    if (mime?.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    return <File className="h-5 w-5 text-muted-foreground" />;
  };

  return (
    <>
      <div className="h-full flex">
        {/* Sidebar */}
        <div className="w-64 border-r bg-surface p-4 flex flex-col gap-2 shrink-0">
          <h2 className="text-sm font-semibold mb-2 px-2 text-muted-foreground uppercase tracking-wider">Categories</h2>
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                category === c ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-foreground'
              }`}
            >
              <Folder className="h-4 w-4" />
              {c}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 bg-background">
          <div className="p-6 border-b shrink-0 flex items-center justify-between bg-surface">
            <div>
              <h1 className="text-page-title-desktop">Document Vault</h1>
              <p className="text-muted-foreground text-sm">Manage and securely store your files.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search documents..." 
                  className="pl-9"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Upload'}
              </Button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileChange}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-5xl mx-auto">
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center p-4 border rounded-lg bg-surface">
                      <Skeleton className="h-10 w-10 rounded-md mr-4" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed rounded-xl bg-surface/50">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium mb-1">No documents found</h3>
                  <p className="text-muted-foreground mb-4">Upload files to securely store them in the vault.</p>
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    Select File
                  </Button>
                </div>
              ) : (
                <div className="bg-surface rounded-xl border overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-medium">Name</th>
                        <th className="px-4 py-3 font-medium">Category</th>
                        <th className="px-4 py-3 font-medium">Size</th>
                        <th className="px-4 py-3 font-medium">Date Added</th>
                        <th className="px-4 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {documents.map(doc => (
                        <tr key={doc.id} className="hover:bg-muted/50 transition-colors group">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {getFileIcon(doc.mime)}
                              <span className="font-medium truncate max-w-[300px]">{doc.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground">
                              {doc.category || 'Uncategorized'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground tabular-nums">
                            {formatSize(doc.size)}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground tabular-nums">
                            {format(new Date(doc.created_at), 'MMM d, yyyy')}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleDownload(doc)}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setRenameDoc(doc);
                                  setNewName(doc.name);
                                }}>
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => {
                                    if(confirm('Are you sure you want to delete this document?')) {
                                      deleteMutation.mutate(doc);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={!!renameDoc} onOpenChange={(open) => !open && setRenameDoc(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Document</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>Document Name</Label>
            <Input 
              value={newName} 
              onChange={e => setNewName(e.target.value)} 
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDoc(null)}>Cancel</Button>
            <Button 
              onClick={() => {
                if (renameDoc && newName.trim()) {
                  renameMutation.mutate({ id: renameDoc.id, name: newName.trim() });
                }
              }}
              disabled={!newName.trim() || renameMutation.isPending}
            >
              {renameMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}