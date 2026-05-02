import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const SUPABASE_URL = 'https://ewezbxdhwuwfzfuqgymb.supabase.co'
const SUPABASE_KEY = 'ssb_publishable_hWnbHiYsUObBrPJuzDu3YQ_PYBhLn39'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function getCurrentUser() {
  const { data } = await supabase.auth.getUser()
  return data?.user ?? null
}
async function getProfile(userId) {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).single()
  if (error) throw error
  return data
}
async function updateProfile(userId, updates) {
  const { data, error } = await supabase.from('users').update(updates).eq('id', userId).select().single()
  if (error) throw error
  return data
}
async function uploadAvatarFile(userId, file) {
  const path = `${userId}/avatar.${file.name.split('.').pop()}`
  const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
  if (error) throw error
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
}
async function uploadCoverFile(userId, file) {
  const path = `${userId}/cover.${file.name.split('.').pop()}`
  const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
  if (error) throw error
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
}
async function getCategories(userId) {
  const { data, error } = await supabase.from('categories').select('*').eq('user_id', userId).order('sort_order')
  if (error) throw error
  return data
}
async function getContents(userId) {
  const { data, error } = await supabase.from('contents').select('*, categories(title)').eq('user_id', userId).order('created_at', { ascending: false })
  if (error) throw error
  return data
}
async function addContent(userId, content) {
  const { data, error } = await supabase.from('contents').insert({ user_id: userId, ...content }).select().single()
  if (error) throw error
  return data
}
async function uploadContentFile(userId, file) {
  const ext = file.name.split('.').pop()
  const path = `${userId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('content-files').upload(path, file)
  if (error) throw error
  return supabase.storage.from('content-files').getPublicUrl(path).data.publicUrl
}
async function uploadThumbnail(userId, file) {
  const ext = file.name.split('.').pop()
  const path = `${userId}/thumb_${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('thumbnails').upload(path, file, { upsert: true })
  if (error) throw error
  return supabase.storage.from('thumbnails').getPublicUrl(path).data.publicUrl
}
async function getPosts() {
  const { data, error } = await supabase.from('posts').select('*, users(username, avatar_url)').order('created_at', { ascending: false })
  if (error) throw error
  return data
}
async function addPost(userId, content) {
  const { data, error } = await supabase.from('posts').insert({ user_id: userId, content }).select().single()
  if (error) throw error
  return data
}
async function getSaves(userId) {
  const { data, error } = await supabase.from('saves').select('*').eq('user_id', userId)
  if (error) throw error
  return data
}
async function toggleSave(userId, targetId, targetType) {
  const { data: existing } = await supabase.from('saves').select('id').eq('user_id', userId).eq('target_id', targetId).eq('target_type', targetType).single()
  if (existing) {
    await supabase.from('saves').delete().eq('id', existing.id)
    return false
  } else {
    await supabase.from('saves').insert({ user_id: userId, target_id: targetId, target_type: targetType })
    return true
  }
}
async function addRef(userId, ref) {
  const { data, error } = await supabase.from('refs').insert({ user_id: userId, ...ref }).select().single()
  if (error) throw error
  return data
}

// Expose semua ke window agar bisa dipakai script biasa
window._SB = {
  getCurrentUser, getProfile, updateProfile,
  uploadAvatarFile, uploadCoverFile,
  getCategories, getContents, addContent,
  uploadContentFile, uploadThumbnail,
  getPosts, addPost,
  getSaves, toggleSave,
  addRef
}

// Tandai siap, lalu trigger init jika sudah ada
window._SB_READY = true
if (typeof window._pendingInit === 'function') window._pendingInit()