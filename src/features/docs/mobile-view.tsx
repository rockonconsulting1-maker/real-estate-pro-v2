import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sb } from '@/lib/queryKeys';
import { docsService, DocumentRecord } from '@/lib/supabase/storage';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Upload, File, MoreVertical, Download, Edit2, Trash2, FileText, Image as ImageIcon } from 'lucide-react';
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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const CATEGORIES = [
  'All',
  'Listing Agreements',
  'Offer Docs',
  'Inspection Reports',
  'Client Files',
  'MLS Sheets',
];

export function MobileDocsView() {
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
      toast.success('Document uploaded');
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
      toast.error(error.message || 'Failed to get link');
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
    if (mime?.startsWith('image/')) return <ImageIcon className="h-8 w-8 text-blue-500" />;
    if (mime?.includes('pdf')) return <FileText className="h-8 w-8 text-red-500" />;
    return <File className="h-8 w-8 text-muted-foreground" />;
  };

  return (
    <>
      <div className="flex flex-col h-full bg-background">
        <div className="p-4 space-y-4 bg-surface border-b shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search documents..." 
              className="pl-9 bg-background"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          
          <ScrollArea className="w-full whitespace-nowrap -mx-4 px-4 pb-2">
            <div className="flex w-max space-x-2">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    category === c ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="hidden" />
          </ScrollArea>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center p-4 border rounded-xl bg-surface">
                <Skeleton className="h-12 w-12 rounded-lg mr-4" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))
          ) : documents.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-1">No documents</h3>
              <p className="text-muted-foreground mb-4 text-sm">Upload files to securely store them.</p>
              <Button onClick={() => fileInputRef.current?.click()}>
                Select File
              </Button>
            </div>
          ) : (
            documents.map(doc => (
              <div key={doc.id} className="flex items-center p-3 border rounded-xl bg-surface">
                <div className="mr-3 bg-muted p-2 rounded-lg">
                  {getFileIcon(doc.mime)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{doc.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span>{formatSize(doc.size)}</span>
                    <span>•</span>
                    <span>{format(new Date(doc.created_at), 'MMM d')}</span>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 ml-2 shrink-0">
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
                        if(confirm('Delete document?')) {
                          deleteMutation.mutate(doc);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>
      </div>

      {/* FAB for upload */}
      <div className="fixed bottom-20 right-4 z-50">
        <Button 
          size="icon" 
          className="h-14 w-14 rounded-full shadow-lg"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? <div className="animate-spin h-6 w-6 border-2 border-primary-foreground border-t-transparent rounded-full" /> : <Upload className="h-6 w-6" />}
        </Button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileChange}
        />
      </div>

      <Dialog open={!!renameDoc} onOpenChange={(open) => !open && setRenameDoc(null)}>
        <DialogContent className="w-[90vw] max-w-[400px] rounded-xl">
          <DialogHeader>
            <DialogTitle>Rename</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input 
              value={newName} 
              onChange={e => setNewName(e.target.value)} 
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDoc(null)} className="w-full sm:w-auto">Cancel</Button>
            <Button 
              onClick={() => {
                if (renameDoc && newName.trim()) {
                  renameMutation.mutate({ id: renameDoc.id, name: newName.trim() });
                }
              }}
              disabled={!newName.trim() || renameMutation.isPending}
              className="w-full sm:w-auto mt-2 sm:mt-0"
            >
              {renameMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}