import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Edit2, Check, X, Loader2, Camera, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUser } from '@/hooks/useUser';
import { useCheckAchievements, useUserAchievements } from '@/hooks/useAchievements';
import { AchievementsGrid } from '@/components/AchievementsGrid';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user, loading, updateUser } = useUser();
  const { checkAndUnlock } = useCheckAchievements();
  const { data: userAchievements } = useUserAchievements();
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check achievements on mount
  useEffect(() => {
    if (user) {
      checkAndUnlock();
    }
  }, [user]);

  const handleSave = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    await updateUser({ name: newName.trim() });
    setEditing(false);
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await updateUser({ avatar_url: publicUrl });
      toast.success('Profile picture updated!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen animated-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-bg">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Profile Card */}
          <div className="glass-card p-8 text-center">
            <div className="relative inline-block mb-4">
              <Avatar className="w-24 h-24 border-4 border-primary/30">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-3xl font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground hover:bg-primary/80 transition-colors shadow-lg disabled:opacity-50"
              >
                {uploadingAvatar ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            <p className="text-xs text-muted-foreground mb-4">
              Click camera icon to change photo
            </p>

            {editing ? (
              <div className="flex items-center gap-2 justify-center mb-4">
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} className="max-w-[200px]" placeholder="New name" />
                <Button size="icon" variant="ghost" onClick={handleSave} disabled={saving}><Check className="w-4 h-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => setEditing(false)}><X className="w-4 h-4" /></Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 justify-center mb-4">
                <h1 className="text-2xl font-display font-bold">{user.name}</h1>
                <button onClick={() => { setNewName(user.name); setEditing(true); }} className="p-1 hover:bg-white/10 rounded">
                  <Edit2 className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            )}

            <div className="xp-badge text-lg mb-4">
              <Sparkles className="w-4 h-4" />
              {user.xp} XP
            </div>

            <div className="text-sm text-muted-foreground">
              Member since {new Date(user.created_at).toLocaleDateString()}
            </div>
          </div>

          {/* Achievements Preview */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">My Achievements</h2>
              </div>
              <Link to="/achievements">
                <Button variant="ghost" size="sm" className="text-primary">
                  View All
                </Button>
              </Link>
            </div>
            <AchievementsGrid showAll={false} />
          </div>

          {/* XP breakdown info */}
          <div className="glass-card p-4 text-left">
            <h3 className="font-semibold mb-2 text-sm">How to earn XP:</h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Watch 25% of video: +2 XP</li>
              <li>• Watch 50% of video: +3 XP</li>
              <li>• Watch 75% of video: +3 XP</li>
              <li>• Complete video: +2 XP</li>
              <li>• Complete PDF: +5 XP</li>
              <li>• Unlock achievements: +5 to +100 XP</li>
            </ul>
          </div>
        </motion.div>
      </main>
    </div>
  );
}