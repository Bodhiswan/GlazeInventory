export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          event_type: string
          glaze_id: string | null
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          glaze_id?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          glaze_id?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_glaze_id_fkey"
            columns: ["glaze_id"]
            isOneToOne: false
            referencedRelation: "glazes"
            referencedColumns: ["id"]
          },
        ]
      }
      combination_comments: {
        Row: {
          author_user_id: string
          body: string
          created_at: string
          example_id: string
          id: string
        }
        Insert: {
          author_user_id: string
          body: string
          created_at?: string
          example_id: string
          id?: string
        }
        Update: {
          author_user_id?: string
          body?: string
          created_at?: string
          example_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "combination_comments_example_id_fkey"
            columns: ["example_id"]
            isOneToOne: false
            referencedRelation: "user_combination_examples"
            referencedColumns: ["id"]
          },
        ]
      }
      combination_pairs: {
        Row: {
          created_at: string
          glaze_a_id: string
          glaze_b_id: string
          id: string
          pair_key: string
        }
        Insert: {
          created_at?: string
          glaze_a_id: string
          glaze_b_id: string
          id?: string
          pair_key: string
        }
        Update: {
          created_at?: string
          glaze_a_id?: string
          glaze_b_id?: string
          id?: string
          pair_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "combination_pairs_glaze_a_id_fkey"
            columns: ["glaze_a_id"]
            isOneToOne: false
            referencedRelation: "glazes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combination_pairs_glaze_b_id_fkey"
            columns: ["glaze_b_id"]
            isOneToOne: false
            referencedRelation: "glazes"
            referencedColumns: ["id"]
          },
        ]
      }
      combination_posts: {
        Row: {
          application_notes: string | null
          author_user_id: string
          caption: string | null
          combination_pair_id: string
          created_at: string
          display_author_name: string | null
          firing_notes: string | null
          id: string
          image_path: string
          status: Database["public"]["Enums"]["post_status"]
          visibility: Database["public"]["Enums"]["post_visibility"]
        }
        Insert: {
          application_notes?: string | null
          author_user_id: string
          caption?: string | null
          combination_pair_id: string
          created_at?: string
          display_author_name?: string | null
          firing_notes?: string | null
          id?: string
          image_path: string
          status?: Database["public"]["Enums"]["post_status"]
          visibility?: Database["public"]["Enums"]["post_visibility"]
        }
        Update: {
          application_notes?: string | null
          author_user_id?: string
          caption?: string | null
          combination_pair_id?: string
          created_at?: string
          display_author_name?: string | null
          firing_notes?: string | null
          id?: string
          image_path?: string
          status?: Database["public"]["Enums"]["post_status"]
          visibility?: Database["public"]["Enums"]["post_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "combination_posts_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combination_posts_combination_pair_id_fkey"
            columns: ["combination_pair_id"]
            isOneToOne: false
            referencedRelation: "combination_pairs"
            referencedColumns: ["id"]
          },
        ]
      }
      combination_ratings: {
        Row: {
          created_at: string
          example_id: string
          id: string
          rating: number
          user_id: string
        }
        Insert: {
          created_at?: string
          example_id: string
          id?: string
          rating: number
          user_id: string
        }
        Update: {
          created_at?: string
          example_id?: string
          id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "combination_ratings_example_id_fkey"
            columns: ["example_id"]
            isOneToOne: false
            referencedRelation: "user_combination_examples"
            referencedColumns: ["id"]
          },
        ]
      }
      community_firing_images: {
        Row: {
          atmosphere: string | null
          combination_id: string | null
          combination_type: string | null
          cone: string | null
          created_at: string
          glaze_id: string | null
          id: string
          image_url: string
          label: string | null
          moderation_state: string
          storage_path: string
          uploader_user_id: string
        }
        Insert: {
          atmosphere?: string | null
          combination_id?: string | null
          combination_type?: string | null
          cone?: string | null
          created_at?: string
          glaze_id?: string | null
          id?: string
          image_url: string
          label?: string | null
          moderation_state?: string
          storage_path: string
          uploader_user_id: string
        }
        Update: {
          atmosphere?: string | null
          combination_id?: string | null
          combination_type?: string | null
          cone?: string | null
          created_at?: string
          glaze_id?: string | null
          id?: string
          image_url?: string
          label?: string | null
          moderation_state?: string
          storage_path?: string
          uploader_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_firing_images_glaze_id_fkey"
            columns: ["glaze_id"]
            isOneToOne: false
            referencedRelation: "glazes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_firing_images_uploader_user_id_fkey"
            columns: ["uploader_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      direct_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          read_at: string | null
          recipient_user_id: string
          sender_user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_user_id: string
          sender_user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_user_id?: string
          sender_user_id?: string
        }
        Relationships: []
      }
      external_example_assets: {
        Row: {
          capture_method: string
          created_at: string
          height: number | null
          id: string
          intake_id: string
          sha256: string
          sort_order: number
          source_image_url: string | null
          storage_path: string
          width: number | null
        }
        Insert: {
          capture_method?: string
          created_at?: string
          height?: number | null
          id?: string
          intake_id: string
          sha256: string
          sort_order?: number
          source_image_url?: string | null
          storage_path: string
          width?: number | null
        }
        Update: {
          capture_method?: string
          created_at?: string
          height?: number | null
          id?: string
          intake_id?: string
          sha256?: string
          sort_order?: number
          source_image_url?: string | null
          storage_path?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "external_example_assets_intake_id_fkey"
            columns: ["intake_id"]
            isOneToOne: false
            referencedRelation: "external_example_intakes"
            referencedColumns: ["id"]
          },
        ]
      }
      external_example_glaze_mentions: {
        Row: {
          approved_at: string | null
          approved_by_user_id: string | null
          confidence: number
          created_at: string
          freeform_text: string
          id: string
          intake_id: string
          is_approved: boolean
          matched_glaze_id: string | null
          mention_order: number
        }
        Insert: {
          approved_at?: string | null
          approved_by_user_id?: string | null
          confidence?: number
          created_at?: string
          freeform_text: string
          id?: string
          intake_id: string
          is_approved?: boolean
          matched_glaze_id?: string | null
          mention_order?: number
        }
        Update: {
          approved_at?: string | null
          approved_by_user_id?: string | null
          confidence?: number
          created_at?: string
          freeform_text?: string
          id?: string
          intake_id?: string
          is_approved?: boolean
          matched_glaze_id?: string | null
          mention_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "external_example_glaze_mentions_approved_by_user_id_fkey"
            columns: ["approved_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_example_glaze_mentions_intake_id_fkey"
            columns: ["intake_id"]
            isOneToOne: false
            referencedRelation: "external_example_intakes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_example_glaze_mentions_matched_glaze_id_fkey"
            columns: ["matched_glaze_id"]
            isOneToOne: false
            referencedRelation: "glazes"
            referencedColumns: ["id"]
          },
        ]
      }
      external_example_intakes: {
        Row: {
          captured_by_user_id: string
          created_at: string
          duplicate_of_intake_id: string | null
          group_label: string
          id: string
          parser_output: Json
          privacy_mode: Database["public"]["Enums"]["external_example_privacy_mode"]
          published_at: string | null
          published_post_id: string | null
          raw_author_display_name: string | null
          raw_caption: string | null
          raw_source_timestamp: string | null
          review_notes: string | null
          review_status: Database["public"]["Enums"]["external_example_review_status"]
          source_platform: string
          source_url: string
          updated_at: string
        }
        Insert: {
          captured_by_user_id: string
          created_at?: string
          duplicate_of_intake_id?: string | null
          group_label: string
          id?: string
          parser_output?: Json
          privacy_mode?: Database["public"]["Enums"]["external_example_privacy_mode"]
          published_at?: string | null
          published_post_id?: string | null
          raw_author_display_name?: string | null
          raw_caption?: string | null
          raw_source_timestamp?: string | null
          review_notes?: string | null
          review_status?: Database["public"]["Enums"]["external_example_review_status"]
          source_platform: string
          source_url: string
          updated_at?: string
        }
        Update: {
          captured_by_user_id?: string
          created_at?: string
          duplicate_of_intake_id?: string | null
          group_label?: string
          id?: string
          parser_output?: Json
          privacy_mode?: Database["public"]["Enums"]["external_example_privacy_mode"]
          published_at?: string | null
          published_post_id?: string | null
          raw_author_display_name?: string | null
          raw_caption?: string | null
          raw_source_timestamp?: string | null
          review_notes?: string | null
          review_status?: Database["public"]["Enums"]["external_example_review_status"]
          source_platform?: string
          source_url?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "external_example_intakes_captured_by_user_id_fkey"
            columns: ["captured_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_example_intakes_duplicate_of_intake_id_fkey"
            columns: ["duplicate_of_intake_id"]
            isOneToOne: false
            referencedRelation: "external_example_intakes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_example_intakes_published_post_id_fkey"
            columns: ["published_post_id"]
            isOneToOne: false
            referencedRelation: "combination_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      glaze_comments: {
        Row: {
          author_user_id: string
          body: string
          created_at: string
          glaze_id: string
          id: string
        }
        Insert: {
          author_user_id: string
          body: string
          created_at?: string
          glaze_id: string
          id?: string
        }
        Update: {
          author_user_id?: string
          body?: string
          created_at?: string
          glaze_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "glaze_comments_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      glaze_firing_images: {
        Row: {
          atmosphere: string | null
          cone: string | null
          created_at: string
          glaze_id: string
          id: string
          image_url: string
          label: string
          sort_order: number
        }
        Insert: {
          atmosphere?: string | null
          cone?: string | null
          created_at?: string
          glaze_id: string
          id?: string
          image_url: string
          label: string
          sort_order?: number
        }
        Update: {
          atmosphere?: string | null
          cone?: string | null
          created_at?: string
          glaze_id?: string
          id?: string
          image_url?: string
          label?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "glaze_firing_images_glaze_id_fkey"
            columns: ["glaze_id"]
            isOneToOne: false
            referencedRelation: "glazes"
            referencedColumns: ["id"]
          },
        ]
      }
      glaze_ratings: {
        Row: {
          created_at: string
          glaze_id: string
          id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          glaze_id: string
          id?: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          glaze_id?: string
          id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "glaze_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      glaze_tag_votes: {
        Row: {
          created_at: string
          glaze_id: string
          id: string
          tag_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          glaze_id: string
          id?: string
          tag_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          glaze_id?: string
          id?: string
          tag_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "glaze_tag_votes_glaze_id_fkey"
            columns: ["glaze_id"]
            isOneToOne: false
            referencedRelation: "glazes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "glaze_tag_votes_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "glaze_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "glaze_tag_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      glaze_tags: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          label: string
          slug: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          label: string
          slug: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          label?: string
          slug?: string
        }
        Relationships: []
      }
      glazes: {
        Row: {
          atmosphere: string | null
          brand: string | null
          code: string | null
          color_notes: string | null
          cone: string | null
          created_at: string
          created_by_user_id: string | null
          description: string | null
          editorial_application: string | null
          editorial_firing: string | null
          editorial_reviewed_at: string | null
          editorial_reviewed_by_user_id: string | null
          editorial_summary: string | null
          editorial_surface: string | null
          finish_notes: string | null
          id: string
          image_url: string | null
          line: string | null
          moderation_state: string | null
          name: string
          recipe_notes: string | null
          source_type: Database["public"]["Enums"]["glaze_source_type"]
        }
        Insert: {
          atmosphere?: string | null
          brand?: string | null
          code?: string | null
          color_notes?: string | null
          cone?: string | null
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          editorial_application?: string | null
          editorial_firing?: string | null
          editorial_reviewed_at?: string | null
          editorial_reviewed_by_user_id?: string | null
          editorial_summary?: string | null
          editorial_surface?: string | null
          finish_notes?: string | null
          id?: string
          image_url?: string | null
          line?: string | null
          moderation_state?: string | null
          name: string
          recipe_notes?: string | null
          source_type: Database["public"]["Enums"]["glaze_source_type"]
        }
        Update: {
          atmosphere?: string | null
          brand?: string | null
          code?: string | null
          color_notes?: string | null
          cone?: string | null
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          editorial_application?: string | null
          editorial_firing?: string | null
          editorial_reviewed_at?: string | null
          editorial_reviewed_by_user_id?: string | null
          editorial_summary?: string | null
          editorial_surface?: string | null
          finish_notes?: string | null
          id?: string
          image_url?: string | null
          line?: string | null
          moderation_state?: string | null
          name?: string
          recipe_notes?: string | null
          source_type?: Database["public"]["Enums"]["glaze_source_type"]
        }
        Relationships: [
          {
            foreignKeyName: "glazes_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "glazes_editorial_reviewed_by_user_id_fkey"
            columns: ["editorial_reviewed_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_folders: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_folders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_item_folders: {
        Row: {
          created_at: string
          folder_id: string
          inventory_item_id: string
        }
        Insert: {
          created_at?: string
          folder_id: string
          inventory_item_id: string
        }
        Update: {
          created_at?: string
          folder_id?: string
          inventory_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_item_folders_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "inventory_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_item_folders_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          created_at: string
          glaze_id: string
          id: string
          personal_notes: string | null
          status: Database["public"]["Enums"]["inventory_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          glaze_id: string
          id?: string
          personal_notes?: string | null
          status?: Database["public"]["Enums"]["inventory_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          glaze_id?: string
          id?: string
          personal_notes?: string | null
          status?: Database["public"]["Enums"]["inventory_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_glaze_id_fkey"
            columns: ["glaze_id"]
            isOneToOne: false
            referencedRelation: "glazes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      points_ledger: {
        Row: {
          action: string
          created_at: string
          id: string
          points: number
          reference_id: string | null
          reference_type: string | null
          user_id: string
          voided: boolean
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          points: number
          reference_id?: string | null
          reference_type?: string | null
          user_id: string
          voided?: boolean
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          points?: number
          reference_id?: string | null
          reference_type?: string | null
          user_id?: string
          voided?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "points_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          contribution_strikes: number
          contribution_tutorial_completed_at: string | null
          contributions_disabled: boolean
          created_at: string
          display_name: string
          email: string | null
          id: string
          is_admin: boolean
          location: string | null
          points: number
          preferred_atmosphere: string | null
          preferred_cone: string | null
          restrict_to_preferred_examples: boolean
          studio_name: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          contribution_strikes?: number
          contribution_tutorial_completed_at?: string | null
          contributions_disabled?: boolean
          created_at?: string
          display_name: string
          email?: string | null
          id: string
          is_admin?: boolean
          location?: string | null
          points?: number
          preferred_atmosphere?: string | null
          preferred_cone?: string | null
          restrict_to_preferred_examples?: boolean
          studio_name?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          contribution_strikes?: number
          contribution_tutorial_completed_at?: string | null
          contributions_disabled?: boolean
          created_at?: string
          display_name?: string
          email?: string | null
          id?: string
          is_admin?: boolean
          location?: string | null
          points?: number
          preferred_atmosphere?: string | null
          preferred_cone?: string | null
          restrict_to_preferred_examples?: boolean
          studio_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reason: string
          reported_by_user_id: string
          status: Database["public"]["Enums"]["report_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reason: string
          reported_by_user_id: string
          status?: Database["public"]["Enums"]["report_status"]
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reason?: string
          reported_by_user_id?: string
          status?: Database["public"]["Enums"]["report_status"]
        }
        Relationships: [
          {
            foreignKeyName: "reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "combination_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_by_user_id_fkey"
            columns: ["reported_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_combination_example_layers: {
        Row: {
          created_at: string
          example_id: string
          glaze_id: string
          id: string
          layer_order: number
        }
        Insert: {
          created_at?: string
          example_id: string
          glaze_id: string
          id?: string
          layer_order: number
        }
        Update: {
          created_at?: string
          example_id?: string
          glaze_id?: string
          id?: string
          layer_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_combination_example_layers_example_id_fkey"
            columns: ["example_id"]
            isOneToOne: false
            referencedRelation: "user_combination_examples"
            referencedColumns: ["id"]
          },
        ]
      }
      user_combination_examples: {
        Row: {
          atmosphere: string
          author_user_id: string
          clay_body: string | null
          cone: string
          created_at: string
          glazing_process: string | null
          id: string
          kiln_notes: string | null
          image_paths: string[]
          moderation_state: string
          notes: string | null
          status: Database["public"]["Enums"]["post_status"]
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["post_visibility"]
        }
        Insert: {
          atmosphere?: string
          author_user_id: string
          clay_body?: string | null
          cone: string
          created_at?: string
          glazing_process?: string | null
          id?: string
          image_paths: string[]
          kiln_notes?: string | null
          moderation_state?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          title: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["post_visibility"]
        }
        Update: {
          atmosphere?: string
          author_user_id?: string
          clay_body?: string | null
          cone?: string
          created_at?: string
          glazing_process?: string | null
          id?: string
          image_paths?: string[]
          kiln_notes?: string | null
          moderation_state?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          title?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["post_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "user_combination_examples_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favourites: {
        Row: {
          created_at: string
          id: string
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
      vendor_combination_example_layers: {
        Row: {
          connector_to_next: string | null
          created_at: string
          example_id: string
          glaze_code: string | null
          glaze_id: string | null
          glaze_name: string
          id: string
          layer_order: number
          source_image_url: string | null
        }
        Insert: {
          connector_to_next?: string | null
          created_at?: string
          example_id: string
          glaze_code?: string | null
          glaze_id?: string | null
          glaze_name: string
          id?: string
          layer_order: number
          source_image_url?: string | null
        }
        Update: {
          connector_to_next?: string | null
          created_at?: string
          example_id?: string
          glaze_code?: string | null
          glaze_id?: string | null
          glaze_name?: string
          id?: string
          layer_order?: number
          source_image_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_combination_example_layers_example_id_fkey"
            columns: ["example_id"]
            isOneToOne: false
            referencedRelation: "vendor_combination_examples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_combination_example_layers_glaze_id_fkey"
            columns: ["glaze_id"]
            isOneToOne: false
            referencedRelation: "glazes"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_combination_examples: {
        Row: {
          application_notes: string | null
          atmosphere: string | null
          clay_body: string | null
          cone: string | null
          created_at: string
          firing_notes: string | null
          id: string
          image_url: string
          source_collection: string
          source_key: string
          source_url: string
          source_vendor: string
          title: string
          updated_at: string
        }
        Insert: {
          application_notes?: string | null
          atmosphere?: string | null
          clay_body?: string | null
          cone?: string | null
          created_at?: string
          firing_notes?: string | null
          id?: string
          image_url: string
          source_collection: string
          source_key: string
          source_url: string
          source_vendor: string
          title: string
          updated_at?: string
        }
        Update: {
          application_notes?: string | null
          atmosphere?: string | null
          clay_body?: string | null
          cone?: string | null
          created_at?: string
          firing_notes?: string | null
          id?: string
          image_url?: string
          source_collection?: string
          source_key?: string
          source_url?: string
          source_vendor?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      external_example_privacy_mode: "anonymous" | "attributed" | "none"
      external_example_review_status:
        | "queued"
        | "approved"
        | "rejected"
        | "duplicate"
        | "published"
      glaze_source_type: "commercial" | "nonCommercial"
      inventory_status: "owned" | "archived" | "wishlist"
      post_status: "published" | "hidden" | "reported"
      post_visibility: "members"
      report_status: "open" | "resolved"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      external_example_privacy_mode: ["anonymous", "attributed", "none"],
      external_example_review_status: [
        "queued",
        "approved",
        "rejected",
        "duplicate",
        "published",
      ],
      glaze_source_type: ["commercial", "nonCommercial"],
      inventory_status: ["owned", "archived", "wishlist"],
      post_status: ["published", "hidden", "reported"],
      post_visibility: ["members"],
      report_status: ["open", "resolved"],
    },
  },
} as const

