import { supabase } from './supabase';
import type { SpaceFlowData, SpaceRecord } from '../types/spaces';

interface SpaceRow {
  id: string;
  user_id: string;
  name: string;
  data: SpaceFlowData;
  created_at: string;
  updated_at: string;
}

const mapRow = (row: SpaceRow): SpaceRecord => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  data: row.data,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const fetchSpaces = async (): Promise<SpaceRecord[]> => {
  const { data, error } = await supabase
    .from('spaces')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load spaces: ${error.message}`);
  }

  return (data || []).map((row: SpaceRow) => mapRow(row));
};

export const createSpace = async (name: string, data: SpaceFlowData): Promise<SpaceRecord> => {
  const userResult = await supabase.auth.getUser();
  const userId = userResult.data.user?.id;
  if (!userId) {
    throw new Error('Authentication required to create space.');
  }

  const now = new Date().toISOString();
  const insertData = {
    id: crypto.randomUUID(),
    user_id: userId,
    name,
    data,
    created_at: now,
    updated_at: now,
  };

  const { data: inserted, error } = await supabase
    .from('spaces')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create space: ${error.message}`);
  }

  return mapRow(inserted as SpaceRow);
};

export const updateSpace = async (
  id: string,
  updates: Partial<Pick<SpaceRecord, 'name' | 'data'>>
): Promise<SpaceRecord> => {
  const now = new Date().toISOString();
  const payload: Partial<SpaceRow> = {
    updated_at: now,
  };

  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.data !== undefined) payload.data = updates.data;

  const { data, error } = await supabase
    .from('spaces')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update space: ${error.message}`);
  }

  return mapRow(data as SpaceRow);
};

export const deleteSpace = async (id: string): Promise<void> => {
  const { error } = await supabase.from('spaces').delete().eq('id', id);
  if (error) {
    throw new Error(`Failed to delete space: ${error.message}`);
  }
};
