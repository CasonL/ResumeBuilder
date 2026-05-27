import { createClient } from '@/lib/supabase/server';

export const CREDIT_COSTS = {
  RESUME_GENERATION: 1,
  RESUME_REFINEMENT: 0, // Free
  SKILL_GENERATION: 0, // Free
};

/**
 * Check if user has enough credits for an operation
 */
export async function hasCredits(userId: string, amount: number): Promise<boolean> {
  const supabase = await createClient();
  
  const { data: user, error } = await supabase
    .from('users')
    .select('credits, is_admin')
    .eq('id', userId)
    .single();

  if (error || !user) {
    return false;
  }

  // Admins bypass credit requirements
  if (user.is_admin) {
    return true;
  }

  return user.credits >= amount;
}

/**
 * Deduct credits from user account and log transaction
 */
export async function deductCredits(
  userId: string,
  amount: number,
  transactionType: string,
  description: string,
  resumeId?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Check if user is admin
  const { data: user } = await supabase
    .from('users')
    .select('is_admin, credits')
    .eq('id', userId)
    .single();

  // Admins don't pay credits
  if (user?.is_admin) {
    return { success: true };
  }

  // Check if user has enough credits
  if (!user || user.credits < amount) {
    return { 
      success: false, 
      error: 'Insufficient credits. Please purchase more credits to continue.' 
    };
  }

  // Deduct credits
  const { error: updateError } = await supabase
    .from('users')
    .update({ credits: user.credits - amount })
    .eq('id', userId);

  if (updateError) {
    return { success: false, error: 'Failed to deduct credits' };
  }

  // Log transaction
  const { error: transactionError } = await supabase
    .from('credit_transactions')
    .insert({
      user_id: userId,
      amount: -amount,
      transaction_type: transactionType,
      description,
      resume_id: resumeId,
    });

  if (transactionError) {
    console.error('Failed to log transaction:', transactionError);
    // Don't fail the operation if logging fails
  }

  return { success: true };
}

/**
 * Add credits to user account
 */
export async function addCredits(
  userId: string,
  amount: number,
  transactionType: string,
  description: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: user } = await supabase
    .from('users')
    .select('credits')
    .eq('id', userId)
    .single();

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  // Add credits
  const { error: updateError } = await supabase
    .from('users')
    .update({ credits: user.credits + amount })
    .eq('id', userId);

  if (updateError) {
    return { success: false, error: 'Failed to add credits' };
  }

  // Log transaction
  await supabase
    .from('credit_transactions')
    .insert({
      user_id: userId,
      amount,
      transaction_type: transactionType,
      description,
    });

  return { success: true };
}

/**
 * Get user's current credit balance
 */
export async function getCredits(userId: string): Promise<number> {
  const supabase = await createClient();
  
  const { data: user } = await supabase
    .from('users')
    .select('credits')
    .eq('id', userId)
    .single();

  return user?.credits || 0;
}

/**
 * Get user's credit transaction history
 */
export async function getCreditHistory(userId: string, limit: number = 50) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch credit history:', error);
    return [];
  }

  return data || [];
}
