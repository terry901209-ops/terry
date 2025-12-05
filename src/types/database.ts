// 数据库类型定义
// 这些类型可以通过 Supabase CLI 自动生成: npx supabase gen types typescript

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: "user" | "admin";
          department: "customer_service" | "sales" | "marketing" | "operations" | "other" | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: "user" | "admin";
          department?: "customer_service" | "sales" | "marketing" | "operations" | "other" | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: "user" | "admin";
          department?: "customer_service" | "sales" | "marketing" | "operations" | "other" | null;
          updated_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          content: string;
          content_type: "markdown" | "pdf" | "word";
          software_version: string | null;
          category: "feature" | "tutorial" | "faq" | "release_note" | "case_study" | "sales_material" | "marketing_material";
          tags: string[];
          cover_image_url: string | null;
          is_published: boolean;
          view_count: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          content: string;
          content_type?: "markdown" | "pdf" | "word";
          software_version?: string | null;
          category: "feature" | "tutorial" | "faq" | "release_note" | "case_study" | "sales_material" | "marketing_material";
          tags?: string[];
          cover_image_url?: string | null;
          is_published?: boolean;
          view_count?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          content?: string;
          content_type?: "markdown" | "pdf" | "word";
          software_version?: string | null;
          category?: "feature" | "tutorial" | "faq" | "release_note" | "case_study" | "sales_material" | "marketing_material";
          tags?: string[];
          cover_image_url?: string | null;
          is_published?: boolean;
          view_count?: number;
          updated_at?: string;
        };
      };
      document_chunks: {
        Row: {
          id: string;
          document_id: string;
          chunk_index: number;
          content: string;
          embedding: number[] | null;
          metadata: Json;
          token_count: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          chunk_index: number;
          content: string;
          embedding?: number[] | null;
          metadata?: Json;
          token_count?: number | null;
          created_at?: string;
        };
        Update: {
          document_id?: string;
          chunk_index?: number;
          content?: string;
          embedding?: number[] | null;
          metadata?: Json;
          token_count?: number | null;
        };
      };
      prompt_templates: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          icon: string | null;
          template_type: "customer_service" | "marketing" | "sales" | "custom";
          system_prompt: string;
          user_prompt_template: string;
          output_format: Json;
          retrieval_config: Json;
          is_active: boolean;
          display_order: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          icon?: string | null;
          template_type: "customer_service" | "marketing" | "sales" | "custom";
          system_prompt: string;
          user_prompt_template: string;
          output_format?: Json;
          retrieval_config?: Json;
          is_active?: boolean;
          display_order?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string | null;
          icon?: string | null;
          template_type?: "customer_service" | "marketing" | "sales" | "custom";
          system_prompt?: string;
          user_prompt_template?: string;
          output_format?: Json;
          retrieval_config?: Json;
          is_active?: boolean;
          display_order?: number;
          updated_at?: string;
        };
      };
      template_form_fields: {
        Row: {
          id: string;
          template_id: string;
          field_name: string;
          field_label: string;
          field_type: "text" | "textarea" | "select" | "multi_select" | "radio" | "checkbox" | "number" | "date";
          is_required: boolean;
          placeholder: string | null;
          help_text: string | null;
          default_value: string | null;
          options: Json | null;
          validation_rules: Json;
          show_condition: Json | null;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          template_id: string;
          field_name: string;
          field_label: string;
          field_type: "text" | "textarea" | "select" | "multi_select" | "radio" | "checkbox" | "number" | "date";
          is_required?: boolean;
          placeholder?: string | null;
          help_text?: string | null;
          default_value?: string | null;
          options?: Json | null;
          validation_rules?: Json;
          show_condition?: Json | null;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          template_id?: string;
          field_name?: string;
          field_label?: string;
          field_type?: "text" | "textarea" | "select" | "multi_select" | "radio" | "checkbox" | "number" | "date";
          is_required?: boolean;
          placeholder?: string | null;
          help_text?: string | null;
          default_value?: string | null;
          options?: Json | null;
          validation_rules?: Json;
          show_condition?: Json | null;
          display_order?: number;
          updated_at?: string;
        };
      };
      chat_sessions: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          session_type: "chat" | "template";
          template_id: string | null;
          context_window: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          session_type?: "chat" | "template";
          template_id?: string | null;
          context_window?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          title?: string | null;
          session_type?: "chat" | "template";
          template_id?: string | null;
          context_window?: Json;
          updated_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          session_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          sources: Json;
          confidence_score: number | null;
          is_fallback: boolean;
          prompt_tokens: number | null;
          completion_tokens: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          sources?: Json;
          confidence_score?: number | null;
          is_fallback?: boolean;
          prompt_tokens?: number | null;
          completion_tokens?: number | null;
          created_at?: string;
        };
        Update: {
          session_id?: string;
          role?: "user" | "assistant" | "system";
          content?: string;
          sources?: Json;
          confidence_score?: number | null;
          is_fallback?: boolean;
          prompt_tokens?: number | null;
          completion_tokens?: number | null;
        };
      };
      generation_history: {
        Row: {
          id: string;
          user_id: string;
          template_id: string;
          input_data: Json;
          output_content: Json;
          sources: Json;
          rating: number | null;
          feedback: string | null;
          is_bookmarked: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          template_id: string;
          input_data: Json;
          output_content: Json;
          sources?: Json;
          rating?: number | null;
          feedback?: string | null;
          is_bookmarked?: boolean;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          template_id?: string;
          input_data?: Json;
          output_content?: Json;
          sources?: Json;
          rating?: number | null;
          feedback?: string | null;
          is_bookmarked?: boolean;
        };
      };
    };
  };
}

// 便捷类型别名
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Document = Database["public"]["Tables"]["documents"]["Row"];
export type DocumentChunk = Database["public"]["Tables"]["document_chunks"]["Row"];
export type PromptTemplate = Database["public"]["Tables"]["prompt_templates"]["Row"];
export type TemplateFormField = Database["public"]["Tables"]["template_form_fields"]["Row"];
export type ChatSession = Database["public"]["Tables"]["chat_sessions"]["Row"];
export type ChatMessage = Database["public"]["Tables"]["chat_messages"]["Row"];
export type GenerationHistory = Database["public"]["Tables"]["generation_history"]["Row"];

// 表单字段选项类型
export interface FormFieldOption {
  value: string;
  label: string;
}

// 引用来源类型
export interface Source {
  document_id: string;
  document_title: string;
  chunk_id: string;
  relevance_score: number;
  excerpt: string;
}
