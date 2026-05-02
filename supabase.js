// ============================================================
//  NISSAN EX — supabase.js
//  Taruh file ini satu folder dengan menu.html
//  Menggantikan seluruh object DB (localStorage)
// ============================================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const SUPABASE_URL = 'https://aayilbennwyasfzddazl.supabase.co'
const SUPABASE_KEY = 'sb_publishable_nXNfkSMsWLgOLs0kB-smmA_uwifOFt4'   // ← paste anon key baru dari dashboard

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── Auth ─────────────────────────────────────────────────────

export async function signUp(email, password, username) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  await supabase.from('users').insert({
    id: data.user.id, email, username, password_hash: '—'
  })
  return data.user
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data.user
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser()
  return data?.user ?? null
}

// ── Users / Profil ───────────────────────────────────────────

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('users').select('*').eq('id', userId).single()
  if (error) throw error
  return data
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('users').update(updates).eq('id', userId).select().single()
  if (error) throw error
  return data
}

// ── Storage: upload avatar / cover ───────────────────────────

export async function uploadAvatar(userId, file) {
  const path = `${userId}/avatar.${file.name.split('.').pop()}`
  const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
  if (error) throw error
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
}

export async function uploadCoverFile(userId, file) {
  const path = `${userId}/cover.${file.name.split('.').pop()}`
  const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
  if (error) throw error
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
}

// ── Categories ───────────────────────────────────────────────

export async function getCategories(userId) {
  const { data, error } = await supabase
    .from('categories').select('*').eq('user_id', userId).order('sort_order')
  if (error) throw error
  return data
}

export async function addCategory(userId, cat) {
  const { data, error } = await supabase
    .from('categories').insert({ user_id: userId, ...cat }).select().single()
  if (error) throw error
  return data
}

export async function deleteCategory(id) {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}

// ── Contents ─────────────────────────────────────────────────

export async function getContents(userId) {
  const { data, error } = await supabase
    .from('contents')
    .select('*, categories(title)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getPublicContents() {
  const { data, error } = await supabase
    .from('contents')
    .select('*, users(username, avatar_url), categories(title)')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function addContent(userId, content) {
  const { data, error } = await supabase
    .from('contents').insert({ user_id: userId, ...content }).select().single()
  if (error) throw error
  return data
}

export async function updateContent(id, updates) {
  const { data, error } = await supabase
    .from('contents').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteContent(id) {
  const { error } = await supabase.from('contents').delete().eq('id', id)
  if (error) throw error
}

export async function uploadContentFile(userId, file) {
  const ext = file.name.split('.').pop()
  const path = `${userId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('content-files').upload(path, file)
  if (error) throw error
  return supabase.storage.from('content-files').getPublicUrl(path).data.publicUrl
}

export async function uploadThumbnail(userId, file) {
  const ext = file.name.split('.').pop()
  const path = `${userId}/thumb_${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('thumbnails').upload(path, file, { upsert: true })
  if (error) throw error
  return supabase.storage.from('thumbnails').getPublicUrl(path).data.publicUrl
}

// ── Posts / Diskusi ──────────────────────────────────────────

export async function getPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select('*, users(username, avatar_url)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function addPost(userId, content) {
  const { data, error } = await supabase
    .from('posts').insert({ user_id: userId, content }).select().single()
  if (error) throw error
  return data
}

export async function deletePost(id) {
  const { error } = await supabase.from('posts').delete().eq('id', id)
  if (error) throw error
}

// ── Saves / Bookmark ─────────────────────────────────────────

export async function getSaves(userId) {
  const { data, error } = await supabase
    .from('saves').select('*').eq('user_id', userId)
  if (error) throw error
  return data
}

export async function toggleSave(userId, targetId, targetType) {
  const { data: existing } = await supabase
    .from('saves').select('id')
    .eq('user_id', userId).eq('target_id', targetId).eq('target_type', targetType)
    .single()
  if (existing) {
    await supabase.from('saves').delete().eq('id', existing.id)
    return false
  } else {
    await supabase.from('saves').insert({ user_id: userId, target_id: targetId, target_type: targetType })
    return true
  }
}

// ── Follows ──────────────────────────────────────────────────

export async function followUser(userId, targetId) {
  const { error } = await supabase
    .from('follows').insert({ user_id: userId, target_id: targetId, target_type: 'user' })
  if (error) throw error
}

export async function unfollowUser(userId, targetId) {
  const { error } = await supabase
    .from('follows').delete().eq('user_id', userId).eq('target_id', targetId)
  if (error) throw error
}

// ── Likes ────────────────────────────────────────────────────

export async function likeContent(userId, targetId) {
  const { error } = await supabase
    .from('likes').insert({ user_id: userId, following_id: targetId, type: 'content' })
  if (error && error.code !== '23505') throw error
}

// ── Tags ─────────────────────────────────────────────────────

export async function getTags(userId) {
  const { data, error } = await supabase
    .from('tags').select('*').eq('user_id', userId)
  if (error) throw error
  return data
}

export async function addTag(userId, message) {
  const { data, error } = await supabase
    .from('tags').insert({ user_id: userId, message }).select().single()
  if (error) throw error
  return data
}

// ── Refs (link web) ──────────────────────────────────────────

export async function getRefs(userId) {
  const { data, error } = await supabase
    .from('refs').select('*').eq('user_id', userId)
  if (error) throw error
  return data
}

export async function addRef(userId, ref) {
  const { data, error } = await supabase
    .from('refs').insert({ user_id: userId, ...ref }).select().single()
  if (error) throw error
  return data
}