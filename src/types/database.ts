export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      areas: {
        Row: {
          id: string
          user_id: string
          name: string
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          position?: number
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          area_id: string | null
          name: string
          emoji: string | null
          notes: string | null
          position: number
          status: 'active' | 'completed' | 'someday'
          deadline: string | null
          created_at: string
          updated_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          area_id?: string | null
          name: string
          emoji?: string | null
          notes?: string | null
          position?: number
          status?: 'active' | 'completed' | 'someday'
          deadline?: string | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          area_id?: string | null
          name?: string
          emoji?: string | null
          notes?: string | null
          position?: number
          status?: 'active' | 'completed' | 'someday'
          deadline?: string | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
      }
      headings: {
        Row: {
          id: string
          project_id: string
          name: string
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          position?: number
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          heading_id: string | null
          title: string
          emoji: string | null
          notes: string | null
          status: 'inbox' | 'active' | 'completed' | 'cancelled'
          schedule: 'anytime' | 'today' | 'this_week' | 'next_week' | 'evening' | 'someday' | null
          scheduled_date: string | null
          deadline: string | null
          position: number
          created_at: string
          updated_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          project_id?: string | null
          heading_id?: string | null
          title: string
          emoji?: string | null
          notes?: string | null
          status?: 'inbox' | 'active' | 'completed' | 'cancelled'
          schedule?: 'anytime' | 'today' | 'this_week' | 'next_week' | 'evening' | 'someday' | null
          scheduled_date?: string | null
          deadline?: string | null
          position?: number
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string | null
          heading_id?: string | null
          title?: string
          emoji?: string | null
          notes?: string | null
          status?: 'inbox' | 'active' | 'completed' | 'cancelled'
          schedule?: 'anytime' | 'today' | 'this_week' | 'next_week' | 'evening' | 'someday' | null
          scheduled_date?: string | null
          deadline?: string | null
          position?: number
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
      }
      tags: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string | null
          created_at?: string
        }
      }
      task_tags: {
        Row: {
          task_id: string
          tag_id: string
        }
        Insert: {
          task_id: string
          tag_id: string
        }
        Update: {
          task_id?: string
          tag_id?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type Area = Database['public']['Tables']['areas']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type Heading = Database['public']['Tables']['headings']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type Tag = Database['public']['Tables']['tags']['Row']

export type AreaInsert = Database['public']['Tables']['areas']['Insert']
export type ProjectInsert = Database['public']['Tables']['projects']['Insert']
export type HeadingInsert = Database['public']['Tables']['headings']['Insert']
export type TaskInsert = Database['public']['Tables']['tasks']['Insert']
export type TagInsert = Database['public']['Tables']['tags']['Insert']
