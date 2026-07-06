import { supabase } from './client';

export type DocumentRecord = {
  id: string;
  user_id: string;
  name: string;
  category: string | null;
  linked_record_type: string | null;
  linked_record_id: string | null;
  ghl_contact_id: string | null;
  size: number | null;
  mime: string | null;
  created_at: string;
};

export const docsService = {
  async uploadFile(file: File, metadata: Partial<DocumentRecord>) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    // 1. Create DB record to get ID
    const { data: dbRecord, error: dbError } = await supabase
      .from('documents')
      .insert({
        user_id: userData.user.id,
        name: file.name,
        size: file.size,
        mime: file.type,
        ...metadata,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // 2. Upload file to storage
    const filePath = `${userData.user.id}/${dbRecord.id}`;
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) {
      // Rollback DB record
      await supabase.from('documents').delete().eq('id', dbRecord.id);
      throw uploadError;
    }

    return dbRecord as DocumentRecord;
  },

  async listDocuments(filters?: { category?: string; linked_record_id?: string; search?: string }) {
    let query = supabase.from('documents').select('*').order('created_at', { ascending: false });
    
    if (filters?.category && filters.category !== 'All') {
      query = query.eq('category', filters.category);
    }
    if (filters?.linked_record_id) {
      query = query.eq('linked_record_id', filters.linked_record_id);
    }
    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as DocumentRecord[];
  },

  async getDownloadUrl(doc: DocumentRecord) {
    const filePath = `${doc.user_id}/${doc.id}`;
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 3600); // 1 hour
      
    if (error) throw error;
    return data.signedUrl;
  },

  async deleteDocument(doc: DocumentRecord) {
    const filePath = `${doc.user_id}/${doc.id}`;
    
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([filePath]);
      
    if (storageError) throw storageError;
    
    // Delete from DB
    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', doc.id);
      
    if (dbError) throw dbError;
  },
  
  async renameDocument(id: string, newName: string) {
    const { data, error } = await supabase
      .from('documents')
      .update({ name: newName })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data as DocumentRecord;
  }
};
