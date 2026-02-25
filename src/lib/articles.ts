/**
 * Articles library - fetches articles from Supabase
 */

import { getSupabaseClient } from './supabase';

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readingTime: number;
  content: string;
  relatedSlugs: string[];
}

interface DbArticle {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  reading_time: number;
  content: string;
  related_slugs: string[];
}

function mapDbToArticle(db: DbArticle): Article {
  return {
    slug: db.slug,
    title: db.title,
    excerpt: db.excerpt,
    category: db.category,
    readingTime: db.reading_time,
    content: db.content,
    relatedSlugs: db.related_slugs || [],
  };
}

/**
 * Get all articles
 */
export async function getArticles(): Promise<Article[]> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching articles:', error);
    return [];
  }
  
  return (data || []).map(mapDbToArticle);
}

/**
 * Get a single article by slug
 */
export async function getArticle(slug: string): Promise<Article | null> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .single();
  
  if (error) {
    console.error('Error fetching article:', error);
    return null;
  }
  
  return data ? mapDbToArticle(data) : null;
}

/**
 * Get related articles by slugs
 */
export async function getRelatedArticles(slugs: string[]): Promise<Article[]> {
  if (!slugs || slugs.length === 0) return [];
  
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .in('slug', slugs);
  
  if (error) {
    console.error('Error fetching related articles:', error);
    return [];
  }
  
  return (data || []).map(mapDbToArticle);
}

/**
 * Get articles by category
 */
export async function getArticlesByCategory(category: string): Promise<Article[]> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('category', category)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching articles by category:', error);
    return [];
  }
  
  return (data || []).map(mapDbToArticle);
}
