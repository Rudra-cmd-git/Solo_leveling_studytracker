import { createClient } from '@/lib/supabase/server'
import { db, ensureDatabase } from '@/lib/db'
import { players, settings, subjects } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function getSupabaseUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getPlayerId(): Promise<number | null> {
  await ensureDatabase()

  const user = await getSupabaseUser()
  if (!user) return null

  // Check if player exists
  const [existing] = await db
    .select({ id: players.id })
    .from(players)
    .where(eq(players.supabaseUserId, user.id))

  if (existing) return existing.id

  // Create new player
  const now = new Date().toISOString()
  const [inserted] = await db
    .insert(players)
    .values({
      supabaseUserId: user.id,
      email: user.email ?? '',
      avatarUrl: user.user_metadata.avatar_url ?? null,
      name: user.user_metadata.full_name ?? 'Hunter',
      totalXp: 0,
      createdAt: now,
    })
    .returning({ id: players.id })

  // Create default settings for new user
  await db.insert(settings).values({
    userId: inserted.id,
    dailyGoalMinutes: 60,
    defaultTimerMinutes: 25,
    timezone: 'Asia/Kolkata',
    soundEnabled: true,
    xpBonusesEnabled: false,
    notificationsEnabled: false,
    reminderTime: '18:00',
    onboarded: false,
  })

  // Seed default subjects
  const defaultSubjects = [
    { name: 'Mathematics', color: '#43a9ff' },
    { name: 'Science', color: '#3dd6a3' },
    { name: 'English', color: '#8c7dff' },
    { name: 'Coding', color: '#ffb84d' },
  ]
  for (const subj of defaultSubjects) {
    await db.insert(subjects).values({
      ...subj,
      userId: inserted.id,
      createdAt: now,
    })
  }

  return inserted.id
}

export async function requirePlayerId(): Promise<number> {
  const playerId = await getPlayerId()
  if (!playerId) throw new Error('Not authenticated')
  return playerId
}